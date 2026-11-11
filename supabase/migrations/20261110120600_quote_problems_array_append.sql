-- text[] || 'literal' can cast the literal as text[] and fail. Use array_append.
CREATE OR REPLACE FUNCTION quote_blocking_reasons(p_id uuid)
RETURNS TABLE(reason text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
  v vehicles;
  d destinations;
  problems text[] := ARRAY[]::text[];
  vehicle_line bigint;
  discount bigint;
  limit_cents bigint;
  item text;
BEGIN
  IF NOT is_aal2() OR auth_role() NOT IN ('ceo', 'sales', 'finance') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_id;
  IF NOT FOUND THEN
    reason := 'Quotation not found.';
    RETURN NEXT;
    RETURN;
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = q.vehicle_id;
  IF v.status IS DISTINCT FROM 'available' OR v.is_mock THEN
    problems := array_append(problems, 'The vehicle is not available.');
  END IF;
  IF q.destination_id IS NULL THEN
    problems := array_append(problems, 'Choose a destination.');
  ELSE
    SELECT * INTO d FROM destinations WHERE id = q.destination_id;
    IF d.status = 'not_served' THEN
      problems := array_append(problems, 'Raptors does not currently export to this destination.');
    ELSIF d.status = 'confirm_each_time' AND q.destination_confirmed_at IS NULL THEN
      problems := array_append(problems, 'Confirm this destination for this quotation.');
    END IF;
  END IF;
  IF q.valid_until < current_date THEN
    problems := array_append(problems, 'The validity date has passed.');
  END IF;
  SELECT amount_cents INTO vehicle_line FROM quote_lines WHERE quote_id = p_id AND kind = 'vehicle';
  IF vehicle_line IS NULL THEN
    problems := array_append(problems, 'Add the vehicle line.');
  ELSIF vehicle_line IS DISTINCT FROM v.price_cents THEN
    problems := array_append(problems, 'The vehicle line must match the vehicle record price.');
  END IF;
  IF quote_total_cents(p_id) < 0 THEN
    problems := array_append(problems, 'Discounts cannot exceed the total.');
  END IF;
  discount := quote_discount_cents(p_id);
  IF EXISTS (
    SELECT 1 FROM approval_requests
    WHERE type = 'quote_discount' AND status = 'pending' AND payload ->> 'quote_id' = p_id::text
  ) THEN
    problems := array_append(problems, 'A discount is waiting for CEO approval.');
  ELSIF discount > 0 AND auth_role() IS DISTINCT FROM 'ceo' THEN
    SELECT quote_discount_limit_cents INTO limit_cents FROM site_settings WHERE singleton;
    IF discount > coalesce(limit_cents, 0) AND NOT EXISTS (
      SELECT 1 FROM approval_requests
      WHERE type = 'quote_discount' AND status = 'approved'
        AND payload ->> 'quote_id' = p_id::text
        AND (payload ->> 'discount_cents')::bigint = discount
    ) THEN
      problems := array_append(problems, 'This discount needs CEO approval.');
    END IF;
  END IF;
  FOREACH item IN ARRAY problems LOOP
    reason := item;
    RETURN NEXT;
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
