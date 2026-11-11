-- Milestone 6: enquiries, quotations, destinations and email templates.
-- Customers, enquiries, quotes and templates are CEO and Sales records. The Administrator has no access,
-- including through the audit log. Public forms reach the database only through submit_enquiry(),
-- which the server calls after its own bot checks.

CREATE TYPE enquiry_kind AS ENUM ('quote_request', 'enquiry', 'information');
CREATE TYPE enquiry_status AS ENUM ('new', 'contacted', 'quoted', 'negotiating', 'won', 'lost', 'spam');
CREATE TYPE contact_preference AS ENUM ('email', 'whatsapp', 'phone');
CREATE TYPE destination_status AS ENUM ('open', 'confirm_each_time', 'not_served');
CREATE TYPE quote_status AS ENUM ('draft', 'previewed', 'sent', 'accepted', 'declined', 'expired', 'superseded');
CREATE TYPE quote_line_kind AS ENUM (
  'vehicle', 'raptors_fee', 'inland_transport', 'export_documents', 'ocean_freight', 'insurance', 'other', 'discount'
);
CREATE TYPE acceptance_method AS ENUM ('email', 'whatsapp', 'phone', 'in_person');
CREATE TYPE template_status AS ENUM ('draft', 'approved');
CREATE TYPE template_audience AS ENUM ('customer', 'staff');
CREATE TYPE notification_status AS ENUM ('sent', 'failed', 'held');

-- ---------------------------------------------------------------------------
-- Vehicle wording for the public page
-- ---------------------------------------------------------------------------
ALTER TABLE vehicles
  ADD COLUMN description text CHECK (description IS NULL OR char_length(description) <= 4000),
  ADD COLUMN features text[] NOT NULL DEFAULT '{}' CHECK (cardinality(features) <= 40);

-- Published wording changes go through propose_vehicle_change(), like the price.
CREATE OR REPLACE FUNCTION vehicles_wording_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('raptors.allow_consequential_edit', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IN ('approved', 'available', 'reserved', 'sold')
     AND (NEW.description IS DISTINCT FROM OLD.description OR NEW.features IS DISTINCT FROM OLD.features) THEN
    RAISE EXCEPTION 'published wording changes need a CEO approval request';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_wording_guard
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION vehicles_wording_guard();

CREATE OR REPLACE FUNCTION approve_vehicle_change(p_id uuid)
RETURNS vehicles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a approval_requests;
  v vehicles;
  p jsonb;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can approve a vehicle change';
  END IF;
  SELECT * INTO a FROM approval_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR a.type IS DISTINCT FROM 'vehicle_change' OR a.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'no pending vehicle change with that id';
  END IF;
  p := a.payload;
  PERFORM set_config('raptors.allow_consequential_edit', 'on', true);
  UPDATE vehicles SET
    price_cents = CASE WHEN p ? 'price_cents' THEN (p ->> 'price_cents')::bigint ELSE price_cents END,
    vin         = CASE WHEN p ? 'vin' THEN p ->> 'vin' ELSE vin END,
    year        = CASE WHEN p ? 'year' THEN (p ->> 'year')::integer ELSE year END,
    make        = CASE WHEN p ? 'make' THEN p ->> 'make' ELSE make END,
    model       = CASE WHEN p ? 'model' THEN p ->> 'model' ELSE model END,
    description = CASE WHEN p ? 'description' THEN nullif(trim(p ->> 'description'), '') ELSE description END,
    features    = CASE WHEN p ? 'features' THEN ARRAY(SELECT jsonb_array_elements_text(p -> 'features')) ELSE features END
  WHERE id = a.vehicle_id
  RETURNING * INTO v;
  PERFORM set_config('raptors.allow_consequential_edit', 'off', true);
  UPDATE approval_requests
    SET status = 'approved', decided_by = auth.uid(), decided_at = now()
    WHERE id = p_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE VIEW public_vehicles
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id, slug, stock_number, vin, year, make, model, trim, body, fuel, transmission, drivetrain,
  engine, power, exterior, interior, mileage, title_status, location, price_cents, currency,
  export_ready, status, created_at, approved_at, description, features
FROM vehicles
WHERE is_mock = false AND status IN ('available', 'reserved', 'sold');

-- The homepage sold strip may show the vehicle's public cover photo. Still no price and no VIN.
CREATE OR REPLACE VIEW public_sold_strip
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  v.id, v.slug, v.year, v.make, v.model, v.trim, v.location, v.exterior,
  (
    SELECT m.id FROM vehicle_media m
    WHERE m.vehicle_id = v.id AND m.kind = 'photo' AND m.status = 'ready'
    ORDER BY m.is_cover DESC, m.sort_order, m.created_at
    LIMIT 1
  ) AS cover_media_id
FROM vehicles v
WHERE v.is_mock = false AND v.status = 'sold';

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
ALTER TABLE site_settings
  ADD COLUMN quote_discount_limit_cents bigint CHECK (quote_discount_limit_cents IS NULL OR quote_discount_limit_cents >= 0);

COMMENT ON COLUMN site_settings.quote_discount_limit_cents IS
  'TO CONFIGURE WITH RAPTORS (Decision 15). Discounts by Sales above this need CEO approval. While empty, every Sales discount needs approval.';

-- ---------------------------------------------------------------------------
-- Numbering: sequential per type and year, never reused
-- ---------------------------------------------------------------------------
CREATE TABLE document_counters (
  kind text NOT NULL CHECK (kind ~ '^[A-Z]{1,4}$'),
  year integer NOT NULL,
  last_value integer NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, year)
);

CREATE OR REPLACE FUNCTION next_document_number(p_kind text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y integer := extract(year FROM now())::integer;
  n integer;
BEGIN
  INSERT INTO document_counters (kind, year, last_value) VALUES (p_kind, y, 1)
  ON CONFLICT (kind, year) DO UPDATE SET last_value = document_counters.last_value + 1
  RETURNING last_value INTO n;
  RETURN p_kind || '-' || y || '-' || lpad(n::text, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- Destinations (minimal; Milestone 7 adds rates, rules and documents)
-- ---------------------------------------------------------------------------
CREATE TABLE destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL CHECK (char_length(trim(country)) BETWEEN 2 AND 80),
  port text NOT NULL CHECK (char_length(trim(port)) BETWEEN 2 AND 80),
  status destination_status NOT NULL DEFAULT 'confirm_each_time',
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  status_set_by uuid REFERENCES staff_users (id),
  status_set_at timestamptz,
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX destinations_country_port ON destinations (lower(trim(country)), lower(trim(port)));

CREATE OR REPLACE FUNCTION destinations_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    IF NEW.status IS DISTINCT FROM 'confirm_each_time' AND auth_role() IS DISTINCT FROM 'ceo' THEN
      RAISE EXCEPTION 'only the CEO decides whether a destination is open';
    END IF;
    IF auth_role() = 'ceo' THEN
      NEW.status_set_by := auth.uid();
      NEW.status_set_at := now();
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth_role() IS DISTINCT FROM 'ceo' THEN
      RAISE EXCEPTION 'only the CEO decides whether a destination is open';
    END IF;
    NEW.status_set_by := auth.uid();
    NEW.status_set_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER destinations_guard BEFORE INSERT OR UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION destinations_guard();

CREATE TRIGGER destinations_updated_at BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE VIEW public_destinations
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, country, port, status
FROM destinations;

COMMENT ON VIEW public_destinations IS 'Country, port and status only. No notes and no staff names.';

-- ---------------------------------------------------------------------------
-- Customers and enquiries
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 254),
  whatsapp text CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 40),
  country text CHECK (country IS NULL OR char_length(country) <= 80),
  preferred_contact contact_preference NOT NULL DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customers_email ON customers (lower(email));

CREATE TABLE enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  kind enquiry_kind NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers (id),
  vehicle_id uuid REFERENCES vehicles (id),
  destination_id uuid REFERENCES destinations (id),
  destination_other text CHECK (destination_other IS NULL OR char_length(destination_other) <= 120),
  message text CHECK (message IS NULL OR char_length(message) <= 2000),
  preferred_contact contact_preference NOT NULL DEFAULT 'email',
  status enquiry_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES staff_users (id),
  first_response_at timestamptz,
  source_path text CHECK (source_path IS NULL OR char_length(source_path) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX enquiries_inbox_idx ON enquiries (status, created_at DESC);

CREATE TABLE enquiry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES enquiries (id),
  kind text NOT NULL CHECK (kind IN ('received', 'status', 'assigned', 'note', 'quote')),
  from_status enquiry_status,
  to_status enquiry_status,
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  actor_id uuid REFERENCES staff_users (id),
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX enquiry_events_idx ON enquiry_events (enquiry_id, at);

CREATE TABLE enquiry_rate (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX enquiry_rate_idx ON enquiry_rate (key, at DESC);

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER enquiries_updated_at BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Status, owner and first-response time are recorded on every change.
CREATE OR REPLACE FUNCTION enquiries_before_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference IS DISTINCT FROM OLD.reference OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.message IS DISTINCT FROM OLD.message THEN
    RAISE EXCEPTION 'what the customer sent is kept as it arrived';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND OLD.status = 'new' AND NEW.first_response_at IS NULL THEN
    NEW.first_response_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enquiries_before_update BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION enquiries_before_update();

CREATE OR REPLACE FUNCTION enquiries_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO enquiry_events (enquiry_id, kind, from_status, to_status, actor_id)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO enquiry_events (enquiry_id, kind, note, actor_id)
    VALUES (NEW.id, 'assigned', (SELECT name FROM staff_users WHERE id = NEW.assigned_to), auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enquiries_after_update AFTER UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION enquiries_after_update();

-- Called by the server with the service role, after its honeypot and timing checks.
CREATE OR REPLACE FUNCTION submit_enquiry(
  p_kind enquiry_kind,
  p_name text,
  p_email text,
  p_whatsapp text,
  p_preferred contact_preference,
  p_vehicle_id uuid,
  p_destination_id uuid,
  p_destination_other text,
  p_message text,
  p_rate_key text,
  p_source_path text
)
RETURNS TABLE (enquiry_id uuid, reference text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  c customers;
  e enquiries;
  ceo_id uuid;
  email_clean text := lower(trim(coalesce(p_email, '')));
BEGIN
  IF p_rate_key IS NULL OR length(p_rate_key) < 8 THEN
    RAISE EXCEPTION 'missing rate key';
  END IF;
  IF (SELECT count(*) FROM enquiry_rate WHERE key = p_rate_key AND at > now() - interval '1 hour') >= 5
     OR (SELECT count(*) FROM enquiry_rate WHERE key = 'email:' || email_clean AND at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'too many requests' USING ERRCODE = 'P0429';
  END IF;
  INSERT INTO enquiry_rate (key) VALUES (p_rate_key), ('email:' || email_clean);

  IF p_vehicle_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM vehicles WHERE id = p_vehicle_id AND is_mock = false AND status IN ('available', 'reserved', 'sold')
  ) THEN
    RAISE EXCEPTION 'that vehicle is not on the public list';
  END IF;
  IF p_kind = 'quote_request' AND p_vehicle_id IS NULL THEN
    RAISE EXCEPTION 'a quote request needs a vehicle';
  END IF;
  IF p_destination_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM destinations WHERE id = p_destination_id) THEN
    RAISE EXCEPTION 'unknown destination';
  END IF;

  INSERT INTO customers (name, email, whatsapp, preferred_contact)
  VALUES (trim(p_name), email_clean, nullif(trim(coalesce(p_whatsapp, '')), ''), coalesce(p_preferred, 'email'))
  ON CONFLICT ((lower(email))) DO UPDATE
    SET whatsapp = coalesce(EXCLUDED.whatsapp, customers.whatsapp)
  RETURNING * INTO c;

  SELECT id INTO ceo_id FROM staff_users WHERE role = 'ceo' AND status = 'active' ORDER BY created_at LIMIT 1;

  INSERT INTO enquiries (
    reference, kind, customer_id, vehicle_id, destination_id, destination_other, message,
    preferred_contact, assigned_to, source_path
  )
  VALUES (
    next_document_number('ENQ'), p_kind, c.id, p_vehicle_id, p_destination_id,
    nullif(trim(coalesce(p_destination_other, '')), ''), nullif(trim(coalesce(p_message, '')), ''),
    coalesce(p_preferred, 'email'), ceo_id, p_source_path
  )
  RETURNING * INTO e;

  INSERT INTO enquiry_events (enquiry_id, kind, to_status) VALUES (e.id, 'received', 'new');

  enquiry_id := e.id;
  reference := e.reference;
  RETURN NEXT;
END;
$$;

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE,
  enquiry_id uuid REFERENCES enquiries (id),
  customer_id uuid NOT NULL REFERENCES customers (id),
  vehicle_id uuid NOT NULL REFERENCES vehicles (id),
  destination_id uuid REFERENCES destinations (id),
  shipping_method text CHECK (shipping_method IS NULL OR shipping_method IN ('container', 'roro')),
  destination_confirmed_by uuid REFERENCES staff_users (id),
  destination_confirmed_at timestamptz,
  valid_until date NOT NULL,
  not_included text NOT NULL DEFAULT 'Import duty, taxes, port fees and the clearing agent in the destination country.'
    CHECK (char_length(not_included) <= 1000),
  customer_note text CHECK (customer_note IS NULL OR char_length(customer_note) <= 1000),
  status quote_status NOT NULL DEFAULT 'draft',
  revision integer NOT NULL DEFAULT 1,
  previewed_revision integer,
  supersedes_id uuid REFERENCES quotes (id),
  prepared_by uuid REFERENCES staff_users (id),
  sent_at timestamptz,
  sent_by uuid REFERENCES staff_users (id),
  sent_to text,
  pdf_path text,
  accepted_on date,
  accepted_by uuid REFERENCES staff_users (id),
  acceptance_method acceptance_method,
  acceptance_note text CHECK (acceptance_note IS NULL OR char_length(acceptance_note) <= 1000),
  declined_at timestamptz,
  declined_reason text CHECK (declined_reason IS NULL OR char_length(declined_reason) <= 1000),
  invoice_status text CHECK (invoice_status IS NULL OR invoice_status = 'to_prepare'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quotes_status_idx ON quotes (status, created_at DESC);
CREATE INDEX quotes_enquiry_idx ON quotes (enquiry_id);
CREATE UNIQUE INDEX quotes_one_open_version ON quotes (supersedes_id) WHERE supersedes_id IS NOT NULL AND status IN ('draft', 'previewed');

COMMENT ON COLUMN quotes.invoice_status IS 'Set when acceptance is recorded. Milestone 8 builds the invoice.';

CREATE TABLE quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes (id),
  kind quote_line_kind NOT NULL,
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX quote_lines_quote_idx ON quote_lines (quote_id, position);
CREATE UNIQUE INDEX quote_lines_one_vehicle ON quote_lines (quote_id) WHERE kind = 'vehicle';

-- Charges in the customer's own country. Shown as estimates and never added to the total.
CREATE TABLE quote_local_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes (id),
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 120),
  estimate_cents bigint CHECK (estimate_cents IS NULL OR estimate_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX quote_local_charges_quote_idx ON quote_local_charges (quote_id, position);

CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Invoker functions: row-level security decides who can see the lines they add up.
CREATE OR REPLACE FUNCTION quote_discount_cents(p_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(sum(amount_cents), 0)::bigint FROM quote_lines WHERE quote_id = p_id AND kind = 'discount';
$$;

-- Payable to Raptors: every line except discounts, less discounts. Local charges are never included.
CREATE OR REPLACE FUNCTION quote_total_cents(p_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(sum(CASE WHEN kind = 'discount' THEN -amount_cents ELSE amount_cents END), 0)::bigint
  FROM quote_lines WHERE quote_id = p_id;
$$;

-- Edits to a draft return it to Draft, so a send always follows a preview of what is sent.
CREATE OR REPLACE FUNCTION quotes_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('raptors.quote_fn', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'use create_quote()';
  END IF;
  IF OLD.status NOT IN ('draft', 'previewed') THEN
    RAISE EXCEPTION 'a sent quotation is never edited; make a new version';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.number IS DISTINCT FROM OLD.number
     OR NEW.enquiry_id IS DISTINCT FROM OLD.enquiry_id OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id OR NEW.supersedes_id IS DISTINCT FROM OLD.supersedes_id
     OR NEW.prepared_by IS DISTINCT FROM OLD.prepared_by OR NEW.sent_at IS DISTINCT FROM OLD.sent_at
     OR NEW.sent_by IS DISTINCT FROM OLD.sent_by OR NEW.sent_to IS DISTINCT FROM OLD.sent_to
     OR NEW.pdf_path IS DISTINCT FROM OLD.pdf_path OR NEW.accepted_on IS DISTINCT FROM OLD.accepted_on
     OR NEW.accepted_by IS DISTINCT FROM OLD.accepted_by OR NEW.acceptance_method IS DISTINCT FROM OLD.acceptance_method
     OR NEW.declined_at IS DISTINCT FROM OLD.declined_at OR NEW.invoice_status IS DISTINCT FROM OLD.invoice_status
     OR NEW.previewed_revision IS DISTINCT FROM OLD.previewed_revision OR NEW.revision IS DISTINCT FROM OLD.revision THEN
    RAISE EXCEPTION 'use the quotation actions for that change';
  END IF;
  IF NEW.destination_id IS DISTINCT FROM OLD.destination_id THEN
    NEW.destination_confirmed_at := NULL;
    NEW.destination_confirmed_by := NULL;
  ELSIF NEW.destination_confirmed_at IS NOT NULL AND OLD.destination_confirmed_at IS NULL THEN
    NEW.destination_confirmed_at := now();
    NEW.destination_confirmed_by := auth.uid();
  ELSIF NEW.destination_confirmed_at IS NULL THEN
    NEW.destination_confirmed_by := NULL;
  ELSE
    NEW.destination_confirmed_at := OLD.destination_confirmed_at;
    NEW.destination_confirmed_by := OLD.destination_confirmed_by;
  END IF;
  IF to_jsonb(NEW) - 'updated_at' IS DISTINCT FROM to_jsonb(OLD) - 'updated_at' THEN
    NEW.revision := OLD.revision + 1;
    NEW.status := 'draft';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotes_guard BEFORE INSERT OR UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION quotes_guard();

CREATE OR REPLACE FUNCTION quote_children_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  qid uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.quote_id ELSE NEW.quote_id END;
  st quote_status;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.quote_id IS DISTINCT FROM OLD.quote_id THEN
    RAISE EXCEPTION 'a line stays on its quotation';
  END IF;
  SELECT status INTO st FROM quotes WHERE id = qid;
  IF current_setting('raptors.quote_fn', true) IS DISTINCT FROM 'on' THEN
    IF st NOT IN ('draft', 'previewed') THEN
      RAISE EXCEPTION 'a sent quotation is never edited; make a new version';
    END IF;
    -- Nested so the kind column is only read on quote_lines.
    IF TG_TABLE_NAME = 'quote_lines' THEN
      IF TG_OP <> 'INSERT' THEN
        IF OLD.kind = 'vehicle' THEN
          RAISE EXCEPTION 'the vehicle line comes from the vehicle record';
        END IF;
      END IF;
    END IF;
    PERFORM set_config('raptors.quote_fn', 'on', true);
    UPDATE quotes SET revision = revision + 1, status = 'draft' WHERE id = qid;
    PERFORM set_config('raptors.quote_fn', 'off', true);
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER quote_lines_guard BEFORE INSERT OR UPDATE OR DELETE ON quote_lines
  FOR EACH ROW EXECUTE FUNCTION quote_children_guard();

CREATE TRIGGER quote_local_charges_guard BEFORE INSERT OR UPDATE OR DELETE ON quote_local_charges
  FOR EACH ROW EXECUTE FUNCTION quote_children_guard();

CREATE OR REPLACE FUNCTION can_quote()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT is_aal2() AND auth_role() IN ('ceo', 'sales');
$$;

-- Everything that stops a quotation being previewed or sent, in plain words.
CREATE OR REPLACE FUNCTION quote_problems(p_id uuid)
RETURNS text[]
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
    RETURN ARRAY['Quotation not found.'];
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = q.vehicle_id;
  IF v.status IS DISTINCT FROM 'available' OR v.is_mock THEN
    problems := array_append(problems, 'The vehicle is not available.')
  END IF;
  IF q.destination_id IS NULL THEN
    problems := array_append(problems, 'Choose a destination.')
  ELSE
    SELECT * INTO d FROM destinations WHERE id = q.destination_id;
    IF d.status = 'not_served' THEN
      problems := array_append(problems, 'Raptors does not currently export to this destination.')
    ELSIF d.status = 'confirm_each_time' AND q.destination_confirmed_at IS NULL THEN
      problems := array_append(problems, 'Confirm this destination for this quotation.')
    END IF;
  END IF;
  IF q.valid_until < current_date THEN
    problems := array_append(problems, 'The validity date has passed.')
  END IF;
  SELECT amount_cents INTO vehicle_line FROM quote_lines WHERE quote_id = p_id AND kind = 'vehicle';
  IF vehicle_line IS NULL THEN
    problems := array_append(problems, 'Add the vehicle line.')
  ELSIF vehicle_line IS DISTINCT FROM v.price_cents THEN
    problems := array_append(problems, 'The vehicle line must match the vehicle record price.')
  END IF;
  IF quote_total_cents(p_id) < 0 THEN
    problems := array_append(problems, 'Discounts cannot exceed the total.')
  END IF;
  discount := quote_discount_cents(p_id);
  IF EXISTS (
    SELECT 1 FROM approval_requests
    WHERE type = 'quote_discount' AND status = 'pending' AND payload ->> 'quote_id' = p_id::text
  ) THEN
    problems := array_append(problems, 'A discount is waiting for CEO approval.')
  ELSIF discount > 0 AND auth_role() IS DISTINCT FROM 'ceo' THEN
    SELECT quote_discount_limit_cents INTO limit_cents FROM site_settings WHERE singleton;
    IF discount > coalesce(limit_cents, 0) AND NOT EXISTS (
      SELECT 1 FROM approval_requests
      WHERE type = 'quote_discount' AND status = 'approved'
        AND payload ->> 'quote_id' = p_id::text
        AND (payload ->> 'discount_cents')::bigint = discount
    ) THEN
      problems := array_append(problems, 'This discount needs CEO approval.')
    END IF;
  END IF;
  RETURN problems;
END;
$$;

CREATE OR REPLACE FUNCTION create_quote(p_enquiry_id uuid, p_destination_id uuid)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e enquiries;
  v vehicles;
  q quotes;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'only the CEO or authorised Sales staff prepare quotations';
  END IF;
  SELECT * INTO e FROM enquiries WHERE id = p_enquiry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'enquiry not found';
  END IF;
  IF e.vehicle_id IS NULL THEN
    RAISE EXCEPTION 'this enquiry has no vehicle to quote';
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = e.vehicle_id;
  IF v.status IS DISTINCT FROM 'available' OR v.is_mock THEN
    RAISE EXCEPTION 'a quotation cannot be prepared for a vehicle that is not available';
  END IF;
  IF p_destination_id IS NOT NULL AND EXISTS (SELECT 1 FROM destinations WHERE id = p_destination_id AND status = 'not_served') THEN
    RAISE EXCEPTION 'Raptors does not currently export to this destination';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  INSERT INTO quotes (enquiry_id, customer_id, vehicle_id, destination_id, valid_until, prepared_by)
  VALUES (e.id, e.customer_id, v.id, coalesce(p_destination_id, e.destination_id), current_date + 14, auth.uid())
  RETURNING * INTO q;
  INSERT INTO quote_lines (quote_id, kind, label, amount_cents, position)
  VALUES (q.id, 'vehicle', v.year || ' ' || v.make || ' ' || v.model || coalesce(' ' || v.trim, ''), v.price_cents, 0);
  PERFORM set_config('raptors.quote_fn', 'off', true);
  RETURN q;
END;
$$;

CREATE OR REPLACE FUNCTION preview_quote(p_id uuid)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
  problems text[];
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
  problems := quote_problems(p_id);
  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION '%', array_to_string(problems, ' ');
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
  problems text[];
  to_email text;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'only the CEO or authorised Sales staff send quotations';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR q.status IS DISTINCT FROM 'previewed' OR q.previewed_revision IS DISTINCT FROM q.revision THEN
    RAISE EXCEPTION 'preview the current version before sending';
  END IF;
  problems := quote_problems(p_id);
  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION '%', array_to_string(problems, ' ');
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

CREATE OR REPLACE FUNCTION attach_quote_pdf(p_id uuid, p_path text)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quotes SET pdf_path = p_path
    WHERE id = p_id AND pdf_path IS NULL AND status NOT IN ('draft', 'previewed')
    RETURNING * INTO q;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'the PDF is stored once, after sending';
  END IF;
  RETURN q;
END;
$$;

CREATE OR REPLACE FUNCTION expire_quotes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NOT is_aal2() OR auth_role() NOT IN ('ceo', 'sales', 'finance') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quotes SET status = 'expired' WHERE status = 'sent' AND valid_until < current_date;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION record_quote_acceptance(p_id uuid, p_method acceptance_method, p_accepted_on date, p_note text)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO records an acceptance';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR q.status IS DISTINCT FROM 'sent' THEN
    RAISE EXCEPTION 'only a sent quotation can be accepted';
  END IF;
  IF p_method IS NULL OR p_accepted_on IS NULL THEN
    RAISE EXCEPTION 'record how and when the customer accepted';
  END IF;
  IF p_accepted_on > current_date THEN
    RAISE EXCEPTION 'the acceptance date cannot be in the future';
  END IF;
  IF p_accepted_on > q.valid_until OR q.valid_until < current_date THEN
    RAISE EXCEPTION 'an expired quotation cannot become an invoice';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quotes
    SET status = 'accepted', accepted_on = p_accepted_on, accepted_by = auth.uid(), acceptance_method = p_method,
        acceptance_note = nullif(trim(coalesce(p_note, '')), ''), invoice_status = 'to_prepare'
    WHERE id = p_id
    RETURNING * INTO q;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  IF q.enquiry_id IS NOT NULL THEN
    UPDATE enquiries SET status = 'won' WHERE id = q.enquiry_id;
    INSERT INTO enquiry_events (enquiry_id, kind, note, actor_id)
    VALUES (q.enquiry_id, 'quote', 'Acceptance of ' || q.number || ' recorded', auth.uid());
  END IF;
  RETURN q;
END;
$$;

CREATE OR REPLACE FUNCTION record_quote_declined(p_id uuid, p_reason text)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'record the reason the customer gave';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  UPDATE quotes SET status = 'declined', declined_at = now(), declined_reason = trim(p_reason)
    WHERE id = p_id AND status = 'sent'
    RETURNING * INTO q;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'only a sent quotation can be declined';
  END IF;
  IF q.enquiry_id IS NOT NULL THEN
    INSERT INTO enquiry_events (enquiry_id, kind, note, actor_id)
    VALUES (q.enquiry_id, 'quote', 'Quotation ' || q.number || ' declined: ' || trim(p_reason), auth.uid());
  END IF;
  RETURN q;
END;
$$;

CREATE OR REPLACE FUNCTION new_quote_version(p_id uuid)
RETURNS quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old quotes;
  q quotes;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT * INTO old FROM quotes WHERE id = p_id;
  IF NOT FOUND OR old.status NOT IN ('sent', 'declined', 'expired') THEN
    RAISE EXCEPTION 'a new version starts from a sent, declined or expired quotation';
  END IF;
  PERFORM set_config('raptors.quote_fn', 'on', true);
  INSERT INTO quotes (
    enquiry_id, customer_id, vehicle_id, destination_id, shipping_method, valid_until, not_included,
    customer_note, supersedes_id, prepared_by
  )
  VALUES (
    old.enquiry_id, old.customer_id, old.vehicle_id, old.destination_id, old.shipping_method, current_date + 14,
    old.not_included, old.customer_note, old.id, auth.uid()
  )
  RETURNING * INTO q;
  INSERT INTO quote_lines (quote_id, kind, label, amount_cents, position)
    SELECT q.id, kind, label, amount_cents, position FROM quote_lines WHERE quote_id = old.id;
  INSERT INTO quote_local_charges (quote_id, label, estimate_cents, note, position)
    SELECT q.id, label, estimate_cents, note, position FROM quote_local_charges WHERE quote_id = old.id;
  PERFORM set_config('raptors.quote_fn', 'off', true);
  RETURN q;
END;
$$;

CREATE OR REPLACE FUNCTION request_quote_discount(p_quote_id uuid)
RETURNS approval_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q quotes;
  discount bigint;
  r approval_requests;
BEGIN
  IF NOT can_quote() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT * INTO q FROM quotes WHERE id = p_quote_id;
  IF NOT FOUND OR q.status NOT IN ('draft', 'previewed') THEN
    RAISE EXCEPTION 'only a draft quotation can ask for a discount';
  END IF;
  discount := quote_discount_cents(p_quote_id);
  IF discount = 0 THEN
    RAISE EXCEPTION 'there is no discount on this quotation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM approval_requests
    WHERE type = 'quote_discount' AND status = 'pending' AND payload ->> 'quote_id' = p_quote_id::text
  ) THEN
    RAISE EXCEPTION 'a discount request is already waiting';
  END IF;
  INSERT INTO approval_requests (type, vehicle_id, summary, payload, requested_by)
  VALUES (
    'quote_discount',
    q.vehicle_id,
    'Quotation discount of $' || to_char(discount / 100.0, 'FM999,999,990.00'),
    jsonb_build_object('quote_id', q.id, 'discount_cents', discount, 'total_cents', quote_total_cents(q.id)),
    auth.uid()
  )
  RETURNING * INTO r;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION approve_quote_discount(p_id uuid)
RETURNS approval_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a approval_requests;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO approves a discount';
  END IF;
  UPDATE approval_requests
    SET status = 'approved', decided_by = auth.uid(), decided_at = now()
    WHERE id = p_id AND type = 'quote_discount' AND status = 'pending'
    RETURNING * INTO a;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no pending discount with that id';
  END IF;
  RETURN a;
END;
$$;

-- ---------------------------------------------------------------------------
-- Email templates and the notification log
-- ---------------------------------------------------------------------------
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL CHECK (key ~ '^[a-z_]+$'),
  version integer NOT NULL DEFAULT 1,
  audience template_audience NOT NULL,
  name text NOT NULL,
  subject text NOT NULL CHECK (char_length(trim(subject)) BETWEEN 1 AND 200),
  eyebrow text CHECK (eyebrow IS NULL OR char_length(eyebrow) <= 60),
  heading text NOT NULL CHECK (char_length(trim(heading)) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) <= 5000),
  button_label text CHECK (button_label IS NULL OR char_length(button_label) <= 60),
  status template_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES staff_users (id),
  approved_at timestamptz,
  UNIQUE (key, version)
);

CREATE OR REPLACE FUNCTION email_templates_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'the CEO edits and approves email wording';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.version := coalesce((SELECT max(version) FROM email_templates WHERE key = NEW.key), 0) + 1;
    NEW.status := 'draft';
    NEW.created_by := auth.uid();
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    RETURN NEW;
  END IF;
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'approved wording is never edited; save a new version';
  END IF;
  IF NEW.key IS DISTINCT FROM OLD.key OR NEW.version IS DISTINCT FROM OLD.version OR NEW.audience IS DISTINCT FROM OLD.audience THEN
    RAISE EXCEPTION 'a template keeps its key, version and audience';
  END IF;
  IF NEW.status = 'approved' THEN
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER email_templates_guard BEFORE INSERT OR UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION email_templates_guard();

CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  template_key text NOT NULL,
  template_version integer,
  audience template_audience NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  status notification_status NOT NULL,
  provider text NOT NULL CHECK (provider IN ('resend', 'mailpit', 'none')),
  provider_id text,
  error text,
  is_test boolean NOT NULL DEFAULT false,
  enquiry_id uuid REFERENCES enquiries (id),
  quote_id uuid REFERENCES quotes (id),
  sent_by uuid REFERENCES staff_users (id)
);

CREATE INDEX notification_log_enquiry_idx ON notification_log (enquiry_id, at DESC);
CREATE INDEX notification_log_quote_idx ON notification_log (quote_id, at DESC);

-- Starter wording. TO CONFIGURE WITH RAPTORS (Decision 14): the CEO edits and approves each one before it reaches a customer.
INSERT INTO email_templates (key, audience, name, subject, eyebrow, heading, body, button_label) VALUES
(
  'enquiry_received', 'customer', 'Enquiry received',
  'We have your enquiry {{reference}}', 'Enquiry received', 'Thank you, {{customer_name}}',
  'We have received your enquiry about {{vehicle_title}}. Your reference is {{reference}}.' || chr(10) || chr(10) ||
  'A member of the Raptors team will reply to you by {{preferred_contact}}. There is nothing more you need to do.',
  NULL
),
(
  'information_request', 'customer', 'Send me the details',
  'The details you asked for: {{vehicle_title}}', 'Your details', 'Here is what you asked for',
  'Thank you for your interest in {{vehicle_title}}. Your reference is {{reference}}.' || chr(10) || chr(10) ||
  'You can see the photographs and specifications at any time on the vehicle page. When you are ready, reply to this email for a quotation with shipping to your port. There is no deadline.',
  'See the vehicle'
),
(
  'staff_new_enquiry', 'staff', 'New enquiry alert',
  'New enquiry {{reference}}', 'New enquiry', '{{reference}} is waiting',
  'A new {{enquiry_kind}} arrived for {{vehicle_title}}. Open the inbox to reply.',
  'Open the inbox'
),
(
  'quotation_sent', 'customer', 'Quotation',
  'Your quotation {{quote_number}}', 'Quotation', 'Your quotation for the {{vehicle_title}}',
  'Your quotation {{quote_number}}, with shipping to {{destination}}, is attached.' || chr(10) || chr(10) ||
  'Total payable to Raptors: {{quote_total}}. It is valid until {{valid_until}}.' || chr(10) || chr(10) ||
  'Charges in your country, such as duty, taxes, port fees and the clearing agent, are not included and are paid locally. To accept, reply to this email or contact your Raptors representative.',
  NULL
);

-- ---------------------------------------------------------------------------
-- Private bucket for issued documents (server only)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('issued-documents', 'issued-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
CREATE TRIGGER destinations_audit AFTER INSERT OR UPDATE OR DELETE ON destinations
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER customers_audit AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER enquiries_audit AFTER INSERT OR UPDATE OR DELETE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER quotes_audit AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER quote_lines_audit AFTER INSERT OR UPDATE OR DELETE ON quote_lines
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER quote_local_charges_audit AFTER INSERT OR UPDATE OR DELETE ON quote_local_charges
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER email_templates_audit AFTER INSERT OR UPDATE OR DELETE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION audit_row();

-- The Administrator reads the audit log, but not rows about customers, quotations or their wording.
DROP POLICY audit_select ON audit_log;
CREATE POLICY audit_select ON audit_log
  FOR SELECT USING (
    is_aal2() AND (
      auth_role() = 'ceo'
      OR (
        auth_role() = 'administrator'
        AND table_name NOT IN ('customers', 'enquiries', 'enquiry_events', 'quotes', 'quote_lines', 'quote_local_charges', 'email_templates', 'notification_log')
      )
    )
  );

DROP POLICY approvals_select ON approval_requests;
CREATE POLICY approvals_select ON approval_requests
  FOR SELECT USING (
    is_aal2() AND (
      auth_role() = 'ceo'
      OR (auth_role() = 'administrator' AND type IS DISTINCT FROM 'quote_discount')
      OR (auth_role() = 'sales' AND type = 'quote_discount')
    )
  );

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
REVOKE ALL ON document_counters, destinations, customers, enquiries, enquiry_events, enquiry_rate,
  quotes, quote_lines, quote_local_charges, email_templates, notification_log FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON destinations TO authenticated;
GRANT SELECT, UPDATE ON customers TO authenticated;
GRANT SELECT, UPDATE ON enquiries TO authenticated;
GRANT SELECT, INSERT ON enquiry_events TO authenticated;
GRANT SELECT, UPDATE ON quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quote_lines, quote_local_charges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_templates TO authenticated;
GRANT SELECT ON notification_log TO authenticated;

GRANT SELECT ON destinations, customers, enquiries, enquiry_events, quotes, quote_lines, quote_local_charges, email_templates TO service_role;
GRANT SELECT, INSERT ON notification_log TO service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON notification_log, enquiry_events FROM authenticated, anon, service_role;

ALTER TABLE document_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_local_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY destinations_select ON destinations
  FOR SELECT USING (is_aal2() AND is_active_staff());
CREATE POLICY destinations_insert ON destinations
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY destinations_update ON destinations
  FOR UPDATE USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY customers_select ON customers
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'sales', 'finance'));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (is_aal2() AND auth_role() IN ('ceo', 'sales'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'sales'));

CREATE POLICY enquiries_select ON enquiries
  FOR SELECT USING (can_quote());
CREATE POLICY enquiries_update ON enquiries
  FOR UPDATE USING (can_quote()) WITH CHECK (can_quote());

CREATE POLICY enquiry_events_select ON enquiry_events
  FOR SELECT USING (can_quote());
CREATE POLICY enquiry_events_insert ON enquiry_events
  FOR INSERT WITH CHECK (can_quote() AND kind = 'note' AND actor_id = auth.uid());

CREATE POLICY quotes_select ON quotes
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'sales', 'finance'));
CREATE POLICY quotes_update ON quotes
  FOR UPDATE USING (can_quote()) WITH CHECK (can_quote());

CREATE POLICY quote_lines_select ON quote_lines
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'sales', 'finance'));
CREATE POLICY quote_lines_write ON quote_lines
  FOR ALL USING (can_quote()) WITH CHECK (can_quote() AND kind IS DISTINCT FROM 'vehicle');

CREATE POLICY quote_local_select ON quote_local_charges
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'sales', 'finance'));
CREATE POLICY quote_local_write ON quote_local_charges
  FOR ALL USING (can_quote()) WITH CHECK (can_quote());

CREATE POLICY templates_select ON email_templates
  FOR SELECT USING (can_quote());
CREATE POLICY templates_insert ON email_templates
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() = 'ceo');
CREATE POLICY templates_update ON email_templates
  FOR UPDATE USING (is_aal2() AND auth_role() = 'ceo') WITH CHECK (is_aal2() AND auth_role() = 'ceo');

CREATE POLICY notification_select ON notification_log
  FOR SELECT USING (can_quote());

REVOKE ALL ON FUNCTION next_document_number(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION submit_enquiry(enquiry_kind, text, text, text, contact_preference, uuid, uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_enquiry(enquiry_kind, text, text, text, contact_preference, uuid, uuid, text, text, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION create_quote(uuid, uuid), preview_quote(uuid), send_quote(uuid), attach_quote_pdf(uuid, text),
  expire_quotes(), record_quote_acceptance(uuid, acceptance_method, date, text), record_quote_declined(uuid, text),
  new_quote_version(uuid), request_quote_discount(uuid), approve_quote_discount(uuid), quote_problems(uuid),
  quote_total_cents(uuid), quote_discount_cents(uuid), can_quote() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_quote(uuid, uuid), preview_quote(uuid), send_quote(uuid), attach_quote_pdf(uuid, text),
  expire_quotes(), record_quote_acceptance(uuid, acceptance_method, date, text), record_quote_declined(uuid, text),
  new_quote_version(uuid), request_quote_discount(uuid), approve_quote_discount(uuid), quote_problems(uuid),
  quote_total_cents(uuid), quote_discount_cents(uuid), can_quote() TO authenticated;
GRANT EXECUTE ON FUNCTION quote_total_cents(uuid), quote_discount_cents(uuid) TO service_role;

REVOKE ALL ON public_destinations FROM PUBLIC;
GRANT SELECT ON public_destinations TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
