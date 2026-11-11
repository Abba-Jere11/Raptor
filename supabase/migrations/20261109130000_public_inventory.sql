-- Milestone 4: a stable public address and anonymous-safe reads.
-- The views run as the owner, so anonymous visitors never receive a grant on
-- vehicles or vehicle_media. The WHERE clause is the publication rule.

CREATE OR REPLACE FUNCTION vehicle_slug(p_year integer, p_make text, p_model text, p_stock text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(BOTH '-' FROM regexp_replace(
    lower(coalesce(p_year::text, '') || '-' || coalesce(p_make, '') || '-' || coalesce(p_model, '') || '-' || coalesce(p_stock, '')),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

ALTER TABLE vehicles ADD COLUMN slug text;

UPDATE vehicles
SET slug = vehicle_slug(year, make, model, stock_number)
WHERE slug IS NULL;

ALTER TABLE vehicles ALTER COLUMN slug SET NOT NULL;

ALTER TABLE vehicles ADD CONSTRAINT vehicles_slug_key UNIQUE (slug);

COMMENT ON COLUMN vehicles.slug IS 'Stable public address from the year, make, model and stock number. Set once.';

CREATE OR REPLACE FUNCTION vehicles_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := vehicle_slug(NEW.year, NEW.make, NEW.model, NEW.stock_number);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_set_slug
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION vehicles_set_slug();

-- The seed already uses raptors.allow_consequential_edit to place records.
-- Reserved and sold stay blocked for ordinary updates. Milestone 8 still owns that change in the app.
CREATE OR REPLACE FUNCTION vehicles_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  allow text;
BEGIN
  allow := current_setting('raptors.allow_consequential_edit', true);

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION 'new vehicles must start as draft';
    END IF;
    RETURN NEW;
  END IF;

  IF allow = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('reserved', 'sold') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'reserved and sold wait for Milestone 8';
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    IF OLD.status IN ('approved', 'available') THEN
      IF NEW.price_cents IS DISTINCT FROM OLD.price_cents
         OR NEW.vin IS DISTINCT FROM OLD.vin
         OR NEW.year IS DISTINCT FROM OLD.year
         OR NEW.make IS DISTINCT FROM OLD.make
         OR NEW.model IS DISTINCT FROM OLD.model THEN
        RAISE EXCEPTION 'consequential fields require a CEO approval request';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    RAISE EXCEPTION 'use approve_vehicle()';
  END IF;

  IF NEW.status = 'available' AND OLD.status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'only an approved vehicle can be marked available';
  END IF;

  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'only a draft can be submitted';
  END IF;

  IF NEW.status = 'draft' AND OLD.status IS DISTINCT FROM 'submitted' THEN
    RAISE EXCEPTION 'only a submitted vehicle can be returned to draft';
  END IF;

  IF NEW.status = 'withdrawn' THEN
    IF NEW.withdrawn_reason IS NULL OR length(trim(NEW.withdrawn_reason)) = 0 THEN
      RAISE EXCEPTION 'withdrawal needs a reason';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE VIEW public_vehicles
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id,
  slug,
  stock_number,
  vin,
  year,
  make,
  model,
  trim,
  body,
  fuel,
  transmission,
  drivetrain,
  engine,
  power,
  exterior,
  interior,
  mileage,
  title_status,
  location,
  price_cents,
  currency,
  export_ready,
  status,
  created_at
FROM vehicles
WHERE is_mock = false
  AND status IN ('available', 'reserved', 'sold');

COMMENT ON VIEW public_vehicles IS
  'Public columns for Available, Reserved and Sold vehicles that are not mock data. Colour filtering uses exterior.';

CREATE VIEW public_vehicle_media
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  m.id,
  m.vehicle_id,
  m.kind,
  m.sort_order,
  m.frame_index,
  m.is_cover,
  m.flaw_label,
  m.alt_text,
  m.document_kind,
  m.visibility,
  m.mime_type,
  m.width,
  m.height,
  m.video_url,
  m.status
FROM vehicle_media m
JOIN vehicles v ON v.id = m.vehicle_id
WHERE v.is_mock = false
  AND v.status IN ('available', 'reserved', 'sold')
  AND m.status = 'ready'
  AND (
    m.kind IN ('photo', 'spin')
    OR (m.kind = 'video' AND m.video_url IS NOT NULL)
    OR (
      m.kind = 'document'
      AND m.visibility = 'public'
      AND m.document_kind IN ('history', 'inspection')
    )
  );

COMMENT ON VIEW public_vehicle_media IS
  'Ready photos, spin frames and https videos, plus public history and inspection files. No paths, Mux ids or title files.';

REVOKE ALL ON public_vehicles FROM PUBLIC;

REVOKE ALL ON public_vehicle_media FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT ON public_vehicles TO anon, authenticated, service_role;

GRANT SELECT ON public_vehicle_media TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
