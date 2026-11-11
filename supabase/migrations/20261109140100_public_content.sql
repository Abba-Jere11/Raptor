-- Milestone 5: homepage wording, featured vehicles and deliveries.
-- Anonymous visitors read the views only. Drafts, prices and personal details stay off those views.

CREATE TYPE content_status AS ENUM ('draft', 'published');

CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton),
  legal_name text,
  licence text,
  city text,
  year_started integer CHECK (year_started IS NULL OR year_started BETWEEN 1900 AND 2100),
  whatsapp_e164 text CHECK (whatsapp_e164 IS NULL OR whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES staff_users (id)
);

INSERT INTO site_settings (singleton) VALUES (true);

CREATE TABLE dealer_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  status content_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dealer_platforms_not_open_auction CHECK (lower(trim(name)) NOT IN ('copart', 'iaa', 'iaai'))
);

CREATE TABLE site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug IN ('about', 'contact', 'legal')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  status content_status NOT NULL DEFAULT 'draft',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES staff_users (id)
);

INSERT INTO site_pages (slug, title) VALUES
  ('about', 'About'),
  ('contact', 'Contact'),
  ('legal', 'Legal');

CREATE TABLE guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  excerpt text,
  body text NOT NULL DEFAULT '',
  topic text,
  confirmed_on date,
  minutes integer CHECK (minutes IS NULL OR minutes BETWEEN 1 AND 60),
  seo_title text,
  seo_description text,
  status content_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE featured_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn')),
  sort_order integer NOT NULL DEFAULT 0,
  proposed_by uuid REFERENCES staff_users (id),
  approved_by uuid REFERENCES staff_users (id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX featured_one_open ON featured_selections (vehicle_id) WHERE status IN ('pending', 'approved');

CREATE TABLE delivery_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  place text NOT NULL CHECK (char_length(trim(place)) BETWEEN 2 AND 120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn')),
  proposed_by uuid REFERENCES staff_users (id),
  approved_by uuid REFERENCES staff_users (id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER dealer_platforms_updated_at BEFORE UPDATE ON dealer_platforms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER site_pages_updated_at BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER guides_updated_at BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER featured_selections_updated_at BEFORE UPDATE ON featured_selections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER delivery_entries_updated_at BEFORE UPDATE ON delivery_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER site_settings_audit AFTER INSERT OR UPDATE OR DELETE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER dealer_platforms_audit AFTER INSERT OR UPDATE OR DELETE ON dealer_platforms
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER site_pages_audit AFTER INSERT OR UPDATE OR DELETE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER guides_audit AFTER INSERT OR UPDATE OR DELETE ON guides
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER faqs_audit AFTER INSERT OR UPDATE OR DELETE ON faqs
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER featured_selections_audit AFTER INSERT OR UPDATE OR DELETE ON featured_selections
  FOR EACH ROW EXECUTE FUNCTION audit_row();

CREATE TRIGGER delivery_entries_audit AFTER INSERT OR UPDATE OR DELETE ON delivery_entries
  FOR EACH ROW EXECUTE FUNCTION audit_row();

-- Seeded rows and the database owner skip the role check. Signed-in staff do not.
CREATE OR REPLACE FUNCTION content_publish_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth_role() IS DISTINCT FROM 'ceo' AND auth_role() IS DISTINCT FROM 'administrator' THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF NEW.status = 'published' AND auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can publish';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND auth_role() IS DISTINCT FROM 'ceo' THEN
    IF TG_TABLE_NAME = 'site_pages' THEN
      IF NEW.title IS DISTINCT FROM OLD.title OR NEW.body IS DISTINCT FROM OLD.body OR NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'published wording is edited by the CEO';
      END IF;
    ELSIF TG_TABLE_NAME = 'guides' THEN
      IF NEW.title IS DISTINCT FROM OLD.title OR NEW.body IS DISTINCT FROM OLD.body OR NEW.excerpt IS DISTINCT FROM OLD.excerpt
         OR NEW.topic IS DISTINCT FROM OLD.topic OR NEW.confirmed_on IS DISTINCT FROM OLD.confirmed_on
         OR NEW.slug IS DISTINCT FROM OLD.slug OR NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'published wording is edited by the CEO';
      END IF;
    ELSIF TG_TABLE_NAME = 'faqs' THEN
      IF NEW.question IS DISTINCT FROM OLD.question OR NEW.answer IS DISTINCT FROM OLD.answer OR NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'published wording is edited by the CEO';
      END IF;
    ELSIF NEW.status IS DISTINCT FROM OLD.status OR to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD) THEN
      RAISE EXCEPTION 'published wording is edited by the CEO';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'guides' AND NEW.status = 'published' THEN
    IF NEW.confirmed_on IS NULL THEN
      RAISE EXCEPTION 'a guide needs the date it was last confirmed';
    END IF;
    IF length(trim(NEW.body)) = 0 THEN
      RAISE EXCEPTION 'a guide needs wording before it is published';
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'site_pages' AND NEW.status = 'published' AND length(trim(NEW.body)) = 0 THEN
    RAISE EXCEPTION 'a page needs wording before it is published';
  END IF;
  IF TG_TABLE_NAME = 'faqs' AND NEW.status = 'published' AND length(trim(NEW.answer)) = 0 THEN
    RAISE EXCEPTION 'a question needs an answer before it is published';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER dealer_platforms_publish BEFORE INSERT OR UPDATE ON dealer_platforms
  FOR EACH ROW EXECUTE FUNCTION content_publish_guard();

CREATE TRIGGER site_pages_publish BEFORE INSERT OR UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION content_publish_guard();

CREATE TRIGGER guides_publish BEFORE INSERT OR UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION content_publish_guard();

CREATE TRIGGER faqs_publish BEFORE INSERT OR UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION content_publish_guard();

CREATE OR REPLACE FUNCTION propose_featured(p_vehicle_id uuid)
RETURNS featured_selections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row featured_selections;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'administrator' THEN
    RAISE EXCEPTION 'only the Administrator can propose a featured vehicle';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM vehicles
    WHERE id = p_vehicle_id AND is_mock = false AND status IN ('available', 'reserved', 'sold')
  ) THEN
    RAISE EXCEPTION 'only a public vehicle can be featured';
  END IF;
  INSERT INTO featured_selections (vehicle_id, status, proposed_by)
  VALUES (p_vehicle_id, 'pending', auth.uid())
  RETURNING * INTO row;
  INSERT INTO approval_requests (type, vehicle_id, summary, payload, requested_by)
  VALUES (
    'featured_selection',
    p_vehicle_id,
    'Feature on the homepage',
    jsonb_build_object('featured_id', row.id),
    auth.uid()
  );
  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION approve_featured(p_id uuid)
RETURNS featured_selections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a approval_requests;
  row featured_selections;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can approve a featured vehicle';
  END IF;
  SELECT * INTO a FROM approval_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR a.type IS DISTINCT FROM 'featured_selection' OR a.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'no pending featured selection with that id';
  END IF;
  UPDATE featured_selections
    SET status = 'approved', approved_by = auth.uid(), approved_at = now()
    WHERE id = (a.payload ->> 'featured_id')::uuid AND status = 'pending'
    RETURNING * INTO row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'featured selection is not waiting';
  END IF;
  UPDATE approval_requests
    SET status = 'approved', decided_by = auth.uid(), decided_at = now()
    WHERE id = p_id;
  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION propose_delivery(p_title text, p_place text)
RETURNS delivery_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row delivery_entries;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'administrator' THEN
    RAISE EXCEPTION 'only the Administrator can propose a delivery';
  END IF;
  INSERT INTO delivery_entries (title, place, status, proposed_by)
  VALUES (trim(p_title), trim(p_place), 'pending', auth.uid())
  RETURNING * INTO row;
  INSERT INTO approval_requests (type, summary, payload, requested_by)
  VALUES (
    'delivery_entry',
    'Delivery: ' || row.title,
    jsonb_build_object('delivery_id', row.id),
    auth.uid()
  );
  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION approve_delivery(p_id uuid)
RETURNS delivery_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a approval_requests;
  row delivery_entries;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can approve a delivery';
  END IF;
  SELECT * INTO a FROM approval_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR a.type IS DISTINCT FROM 'delivery_entry' OR a.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'no pending delivery with that id';
  END IF;
  UPDATE delivery_entries
    SET status = 'approved', approved_by = auth.uid(), approved_at = now()
    WHERE id = (a.payload ->> 'delivery_id')::uuid AND status = 'pending'
    RETURNING * INTO row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'delivery is not waiting';
  END IF;
  UPDATE approval_requests
    SET status = 'approved', decided_by = auth.uid(), decided_at = now()
    WHERE id = p_id;
  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION withdraw_featured(p_id uuid)
RETURNS featured_selections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row featured_selections;
BEGIN
  IF NOT is_aal2() OR (auth_role() IS DISTINCT FROM 'ceo' AND auth_role() IS DISTINCT FROM 'administrator') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE featured_selections
    SET status = 'withdrawn'
    WHERE id = p_id AND status IN ('pending', 'approved')
    RETURNING * INTO row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'nothing to withdraw';
  END IF;
  UPDATE approval_requests
    SET status = 'cancelled', decided_by = auth.uid(), decided_at = now()
    WHERE type = 'featured_selection' AND status = 'pending' AND payload ->> 'featured_id' = p_id::text;
  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION withdraw_delivery(p_id uuid)
RETURNS delivery_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row delivery_entries;
BEGIN
  IF NOT is_aal2() OR (auth_role() IS DISTINCT FROM 'ceo' AND auth_role() IS DISTINCT FROM 'administrator') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE delivery_entries
    SET status = 'withdrawn'
    WHERE id = p_id AND status IN ('pending', 'approved')
    RETURNING * INTO row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'nothing to withdraw';
  END IF;
  UPDATE approval_requests
    SET status = 'cancelled', decided_by = auth.uid(), decided_at = now()
    WHERE type = 'delivery_entry' AND status = 'pending' AND payload ->> 'delivery_id' = p_id::text;
  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION decline_approval(p_id uuid, p_reason text)
RETURNS approval_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a approval_requests;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can decline';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'declining needs a reason';
  END IF;
  UPDATE approval_requests
    SET status = 'declined', decided_by = auth.uid(), decided_at = now(), decline_reason = p_reason
    WHERE id = p_id AND status = 'pending'
    RETURNING * INTO a;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no pending approval with that id';
  END IF;
  IF a.type = 'vehicle_publication' THEN
    UPDATE vehicles SET status = 'draft' WHERE id = a.vehicle_id AND status = 'submitted';
  ELSIF a.type = 'featured_selection' THEN
    UPDATE featured_selections SET status = 'declined'
      WHERE id = (a.payload ->> 'featured_id')::uuid AND status = 'pending';
  ELSIF a.type = 'delivery_entry' THEN
    UPDATE delivery_entries SET status = 'declined'
      WHERE id = (a.payload ->> 'delivery_id')::uuid AND status = 'pending';
  END IF;
  RETURN a;
END;
$$;

CREATE OR REPLACE VIEW public_vehicles
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id, slug, stock_number, vin, year, make, model, trim, body, fuel, transmission, drivetrain,
  engine, power, exterior, interior, mileage, title_status, location, price_cents, currency,
  export_ready, status, created_at, approved_at
FROM vehicles
WHERE is_mock = false AND status IN ('available', 'reserved', 'sold');

CREATE VIEW public_site_settings
WITH (security_barrier = true, security_invoker = false) AS
SELECT legal_name, licence, city, year_started, whatsapp_e164
FROM site_settings
WHERE singleton;

CREATE VIEW public_site_pages
WITH (security_barrier = true, security_invoker = false) AS
SELECT slug, title, body, seo_title, seo_description
FROM site_pages
WHERE status = 'published' AND length(trim(body)) > 0;

CREATE VIEW public_guides
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, slug, title, excerpt, body, topic, confirmed_on, minutes, seo_title, seo_description
FROM guides
WHERE status = 'published';

CREATE VIEW public_faqs
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, question, answer, sort_order
FROM faqs
WHERE status = 'published' AND length(trim(answer)) > 0;

CREATE VIEW public_platforms
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, name, sort_order
FROM dealer_platforms
WHERE status = 'published';

CREATE VIEW public_featured
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  f.id, f.sort_order, f.approved_at,
  v.id AS vehicle_id, v.slug, v.year, v.make, v.model, v.trim, v.exterior, v.location, v.status
FROM featured_selections f
JOIN vehicles v ON v.id = f.vehicle_id
WHERE f.status = 'approved'
  AND v.is_mock = false
  AND v.status IN ('available', 'reserved', 'sold');

CREATE VIEW public_deliveries
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, title, place, approved_at
FROM delivery_entries
WHERE status = 'approved';

CREATE VIEW public_sold_strip
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, slug, year, make, model, trim, location, exterior
FROM vehicles
WHERE is_mock = false AND status = 'sold';

COMMENT ON VIEW public_deliveries IS 'Approved deliveries. No price and no customer name.';

COMMENT ON VIEW public_sold_strip IS 'Sold vehicles for the homepage. No price and no VIN.';

REVOKE ALL ON site_settings, dealer_platforms, site_pages, guides, faqs, featured_selections, delivery_entries FROM PUBLIC, anon;

GRANT SELECT, UPDATE ON site_settings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON dealer_platforms, guides, faqs TO authenticated;

GRANT SELECT, INSERT, UPDATE ON site_pages TO authenticated;

GRANT SELECT, INSERT, UPDATE ON featured_selections, delivery_entries TO authenticated;

GRANT SELECT, UPDATE ON site_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON dealer_platforms, site_pages, guides, faqs, featured_selections, delivery_entries TO service_role;

REVOKE ALL ON FUNCTION propose_featured(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION approve_featured(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION withdraw_featured(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION propose_delivery(text, text) FROM PUBLIC;

REVOKE ALL ON FUNCTION approve_delivery(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION withdraw_delivery(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION propose_featured(uuid), approve_featured(uuid), withdraw_featured(uuid), propose_delivery(text, text), approve_delivery(uuid), withdraw_delivery(uuid) TO authenticated;

REVOKE ALL ON public_site_settings, public_site_pages, public_guides, public_faqs, public_platforms, public_featured, public_deliveries, public_sold_strip FROM PUBLIC;

GRANT SELECT ON public_site_settings, public_site_pages, public_guides, public_faqs, public_platforms, public_featured, public_deliveries, public_sold_strip TO anon, authenticated, service_role;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE dealer_platforms ENABLE ROW LEVEL SECURITY;

ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

ALTER TABLE featured_selections ENABLE ROW LEVEL SECURITY;

ALTER TABLE delivery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_settings_select ON site_settings
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY site_settings_update ON site_settings
  FOR UPDATE USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY platforms_staff ON dealer_platforms
  FOR ALL USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY pages_select ON site_pages
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY pages_insert ON site_pages
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY pages_update ON site_pages
  FOR UPDATE USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY guides_staff ON guides
  FOR ALL USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY faqs_staff ON faqs
  FOR ALL USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY featured_select ON featured_selections
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY featured_insert ON featured_selections
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() = 'administrator' AND status = 'pending');

CREATE POLICY featured_update_admin ON featured_selections
  FOR UPDATE USING (is_aal2() AND auth_role() = 'administrator')
  WITH CHECK (status IN ('pending', 'withdrawn'));

CREATE POLICY featured_update_ceo ON featured_selections
  FOR UPDATE USING (is_aal2() AND auth_role() = 'ceo');

CREATE POLICY delivery_select ON delivery_entries
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY delivery_insert ON delivery_entries
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() = 'administrator' AND status = 'pending');

CREATE POLICY delivery_update_admin ON delivery_entries
  FOR UPDATE USING (is_aal2() AND auth_role() = 'administrator')
  WITH CHECK (status IN ('pending', 'withdrawn'));

CREATE POLICY delivery_update_ceo ON delivery_entries
  FOR UPDATE USING (is_aal2() AND auth_role() = 'ceo');

NOTIFY pgrst, 'reload schema';
