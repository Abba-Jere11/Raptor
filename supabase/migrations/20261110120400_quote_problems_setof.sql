-- PostgREST still mis-parses scalar/jsonb array returns for this RPC. SETOF text
-- comes back as a JSON array of strings, including a single problem.
DROP FUNCTION IF EXISTS quote_problems(uuid);

CREATE OR REPLACE FUNCTION quote_problems(p_id uuid)
RETURNS SETOF text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
  v vehicles;
  d destinations;
  problems text[] := '{}';
  vehicle_line bigint;
  discount bigint;
  limit_cents bigint;
BEGIN
  IF NOT is_aal2() OR auth_role() NOT IN ('ceo', 'sales', 'finance') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'Quotation not found.';
    RETURN;
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = q.vehicle_id;
  IF v.status IS DISTINCT FROM 'available' OR v.is_mock THEN
    problems := problems || 'The vehicle is not available.';
  END IF;
  IF q.destination_id IS NULL THEN
    problems := problems || 'Choose a destination.';
  ELSE
    SELECT * INTO d FROM destinations WHERE id = q.destination_id;
    IF d.status = 'not_served' THEN
      problems := problems || 'Raptors does not currently export to this destination.';
    ELSIF d.status = 'confirm_each_time' AND q.destination_confirmed_at IS NULL THEN
      problems := problems || 'Confirm this destination for this quotation.';
    END IF;
  END IF;
  IF q.valid_until < current_date THEN
    problems := problems || 'The validity date has passed.';
  END IF;
  SELECT amount_cents INTO vehicle_line FROM quote_lines WHERE quote_id = p_id AND kind = 'vehicle';
  IF vehicle_line IS NULL THEN
    problems := problems || 'Add the vehicle line.';
  ELSIF vehicle_line IS DISTINCT FROM v.price_cents THEN
    problems := problems || 'The vehicle line must match the vehicle record price.';
  END IF;
  IF quote_total_cents(p_id) < 0 THEN
    problems := problems || 'Discounts cannot exceed the total.';
  END IF;
  discount := quote_discount_cents(p_id);
  IF EXISTS (
    SELECT 1 FROM approval_requests
    WHERE type = 'quote_discount' AND status = 'pending' AND payload ->> 'quote_id' = p_id::text
  ) THEN
    problems := problems || 'A discount is waiting for CEO approval.';
  ELSIF discount > 0 AND auth_role() IS DISTINCT FROM 'ceo' THEN
    SELECT quote_discount_limit_cents INTO limit_cents FROM site_settings WHERE singleton;
    IF discount > coalesce(limit_cents, 0) AND NOT EXISTS (
      SELECT 1 FROM approval_requests
      WHERE type = 'quote_discount' AND status = 'approved'
        AND payload ->> 'quote_id' = p_id::text
        AND (payload ->> 'discount_cents')::bigint = discount
    ) THEN
      problems := problems || 'This discount needs CEO approval.';
    END IF;
  END IF;
  RETURN QUERY SELECT unnest(problems);
END;
$$;

REVOKE ALL ON FUNCTION quote_problems(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION quote_problems(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION preview_quote(p_id uuid)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
  problem_text text;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'only the CEO or authorised Sales staff prepare quotations';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR q.status NOT IN ('draft', 'previewed') THEN
    RAISE EXCEPTION 'only a draft can be previewed';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quote_lines l SET amount_cents = v.price_cents
    FROM vehicles v
    WHERE l.quote_id = p_id AND l.kind = 'vehicle' AND v.id = q.vehicle_id AND l.amount_cents IS DISTINCT FROM v.price_cents;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  SELECT string_agg(p, ' ') INTO problem_text FROM quote_problems(p_id) AS p;
  IF problem_text IS NOT NULL THEN
    RAISE EXCEPTION '%', problem_text;
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quotes SET status = 'previewed', previewed_revision = revision WHERE id = p_id RETURNING * INTO q;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  RETURN q;
END;
$$;

CREATE OR REPLACE FUNCTION send_quote(p_id uuid)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
  problem_text text;
  to_email text;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'only the CEO or authorised Sales staff send quotations';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR q.status IS DISTINCT FROM 'previewed' OR q.previewed_revision IS DISTINCT FROM q.revision THEN
    RAISE EXCEPTION 'preview the current version before sending';
  END IF;
  SELECT string_agg(p, ' ') INTO problem_text FROM quote_problems(p_id) AS p;
  IF problem_text IS NOT NULL THEN
    RAISE EXCEPTION '%', problem_text;
  END IF;
  SELECT email INTO to_email FROM customers WHERE id = q.customer_id;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quotes
    SET status = 'sent', number = next_document_number('Q'), sent_at = now(), sent_by = auth.uid(), sent_to = to_email
    WHERE id = p_id
    RETURNING * INTO q;
  IF q.supersedes_id IS NOT NULL THEN
    UPDATE quotes SET status = 'superseded'
      WHERE id = q.supersedes_id AND status IN ('sent', 'declined', 'expired');
  END IF;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  IF q.enquiry_id IS NOT NULL THEN
    UPDATE enquiries SET status = 'quoted' WHERE id = q.enquiry_id AND status IN ('new', 'contacted');
    INSERT INTO enquiry_events (enquiry_id, kind, note, actor_id)
    VALUES (q.enquiry_id, 'quote', 'Quotation ' || q.number || ' sent', auth.uid());
  END IF;
  RETURN q;
END;
$$;

NOTIFY pgrst, 'reload schema';
