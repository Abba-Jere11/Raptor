-- Milestone 2 foundation: staff, vehicles, costs, approvals, audit log.
-- Permissions are enforced here (RLS + triggers), not only in the UI.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE staff_role AS ENUM ('ceo', 'administrator', 'sales', 'finance');
CREATE TYPE staff_status AS ENUM ('active', 'deactivated');
CREATE TYPE authorisation_status AS ENUM ('pending', 'consumed', 'revoked');
CREATE TYPE vehicle_status AS ENUM (
  'draft', 'submitted', 'approved', 'available', 'reserved', 'sold', 'withdrawn'
);
CREATE TYPE title_status AS ENUM ('clean', 'rebuilt', 'pending');
CREATE TYPE cost_kind AS ENUM ('purchase', 'platform_fees', 'transport', 'repair', 'other');
CREATE TYPE approval_type AS ENUM ('vehicle_publication', 'vehicle_change');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'declined', 'cancelled');

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
CREATE TABLE staff_users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role staff_role NOT NULL,
  status staff_status NOT NULL DEFAULT 'active',
  authorisation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_authorisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role staff_role NOT NULL CHECK (role IN ('administrator', 'sales', 'finance')),
  status authorisation_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  consumed_by uuid REFERENCES staff_users (id),
  notes text
);

ALTER TABLE staff_users
  ADD CONSTRAINT staff_users_authorisation_id_fkey
  FOREIGN KEY (authorisation_id) REFERENCES staff_authorisations (id);

CREATE UNIQUE INDEX staff_authorisations_one_pending
  ON staff_authorisations (lower(email))
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
CREATE SEQUENCE vehicle_stock_seq START WITH 400;

CREATE OR REPLACE FUNCTION next_stock_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'RA-' || lpad(nextval('vehicle_stock_seq')::text, 4, '0');
$$;

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_number text NOT NULL UNIQUE DEFAULT next_stock_number() CHECK (stock_number ~ '^RA-[0-9]{4,}$'),
  vin text NOT NULL UNIQUE CHECK (vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  year integer NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  body text,
  fuel text,
  transmission text,
  drivetrain text,
  engine text,
  power text,
  exterior text,
  interior text,
  mileage integer NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  title_status title_status NOT NULL DEFAULT 'pending',
  location text,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  export_ready boolean NOT NULL DEFAULT false,
  status vehicle_status NOT NULL DEFAULT 'draft',
  withdrawn_reason text,
  notes text,
  is_mock boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES staff_users (id),
  approved_at timestamptz,
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

CREATE INDEX vehicles_status_idx ON vehicles (status);
CREATE INDEX vehicles_make_model_idx ON vehicles (make, model);

CREATE TABLE vehicle_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  kind cost_kind NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  note text,
  corrects_id uuid REFERENCES vehicle_costs (id),
  recorded_by uuid REFERENCES staff_users (id),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehicle_costs_vehicle_idx ON vehicle_costs (vehicle_id);

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------
CREATE TABLE approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type approval_type NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  vehicle_id uuid REFERENCES vehicles (id) ON DELETE CASCADE,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  requested_by uuid REFERENCES staff_users (id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid REFERENCES staff_users (id),
  decided_at timestamptz,
  decline_reason text
);

CREATE INDEX approval_requests_pending_idx ON approval_requests (status, requested_at DESC);

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_role staff_role,
  action text NOT NULL,
  table_name text NOT NULL,
  row_id uuid,
  before jsonb,
  after jsonb
);

CREATE INDEX audit_log_row_idx ON audit_log (table_name, row_id, at DESC);
CREATE INDEX audit_log_actor_idx ON audit_log (actor_id, at DESC);

-- ---------------------------------------------------------------------------
-- Helpers (used by RLS and triggers)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM staff_users
  WHERE id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION is_active_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_users
    WHERE id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_TABLE_NAME = 'vehicles' THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER staff_users_updated_at
  BEFORE UPDATE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  before_j jsonb;
  after_j jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    before_j := to_jsonb(OLD);
    after_j := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    before_j := NULL;
    after_j := to_jsonb(NEW);
  ELSE
    before_j := to_jsonb(OLD);
    after_j := to_jsonb(NEW);
  END IF;

  -- Administrator may read the log; never persist cost amounts there.
  IF TG_TABLE_NAME = 'vehicle_costs' THEN
    IF before_j IS NOT NULL THEN before_j := before_j - 'amount_cents'; END IF;
    IF after_j IS NOT NULL THEN after_j := after_j - 'amount_cents'; END IF;
  END IF;

  INSERT INTO audit_log (actor_id, actor_role, action, table_name, row_id, before, after)
  VALUES (
    auth.uid(),
    auth_role(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    before_j,
    after_j
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER staff_users_audit AFTER INSERT OR UPDATE OR DELETE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER staff_authorisations_audit AFTER INSERT OR UPDATE OR DELETE ON staff_authorisations
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER vehicles_audit AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER vehicle_costs_audit AFTER INSERT OR UPDATE OR DELETE ON vehicle_costs
  FOR EACH ROW EXECUTE FUNCTION audit_row();
CREATE TRIGGER approval_requests_audit AFTER INSERT OR UPDATE OR DELETE ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION audit_row();

-- ---------------------------------------------------------------------------
-- Status and field guards
-- ---------------------------------------------------------------------------
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

  IF NEW.status IN ('reserved', 'sold') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'reserved and sold wait for Milestone 8';
  END IF;

  IF allow = 'on' THEN
    RETURN NEW;
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

CREATE TRIGGER vehicles_guard
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION vehicles_guard();

CREATE OR REPLACE FUNCTION vehicles_after_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    INSERT INTO approval_requests (type, vehicle_id, summary, payload, requested_by)
    VALUES (
      'vehicle_publication',
      NEW.id,
      NEW.year || ' ' || NEW.make || ' ' || NEW.model || ' (' || NEW.stock_number || '): publish listing',
      jsonb_build_object('vehicle_id', NEW.id, 'stock_number', NEW.stock_number),
      auth.uid()
    );
  END IF;

  IF NEW.status = 'draft' AND OLD.status = 'submitted' THEN
    UPDATE approval_requests
      SET status = 'cancelled', decided_at = now()
      WHERE vehicle_id = NEW.id AND type = 'vehicle_publication' AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_after_status
  AFTER UPDATE OF status ON vehicles
  FOR EACH ROW EXECUTE FUNCTION vehicles_after_status();

CREATE OR REPLACE FUNCTION staff_users_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'roles are set by the CEO authorisation, not edited later';
    END IF;
    IF OLD.role = 'ceo' AND NEW.status = 'deactivated' THEN
      RAISE EXCEPTION 'the CEO account cannot be deactivated here';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'staff identity cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER staff_users_guard
  BEFORE UPDATE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION staff_users_guard();

-- ---------------------------------------------------------------------------
-- CEO functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION approve_vehicle(p_id uuid)
RETURNS vehicles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v vehicles;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can approve a vehicle';
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'vehicle not found';
  END IF;
  IF v.status IS DISTINCT FROM 'submitted' THEN
    RAISE EXCEPTION 'only a submitted vehicle can be approved';
  END IF;
  PERFORM set_config('raptors.allow_consequential_edit', 'on', true);
  UPDATE vehicles
    SET status = 'approved',
        approved_by = auth.uid(),
        approved_at = now()
    WHERE id = p_id
    RETURNING * INTO v;
  UPDATE approval_requests
    SET status = 'approved', decided_by = auth.uid(), decided_at = now()
    WHERE vehicle_id = p_id AND type = 'vehicle_publication' AND status = 'pending';
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION decline_vehicle(p_id uuid, p_reason text)
RETURNS vehicles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v vehicles;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'ceo' THEN
    RAISE EXCEPTION 'only the CEO can decline a vehicle';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'declining needs a reason';
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = p_id FOR UPDATE;
  IF v.status IS DISTINCT FROM 'submitted' THEN
    RAISE EXCEPTION 'only a submitted vehicle can be declined';
  END IF;
  UPDATE vehicles SET status = 'draft' WHERE id = p_id RETURNING * INTO v;
  UPDATE approval_requests
    SET status = 'declined', decided_by = auth.uid(), decided_at = now(), decline_reason = p_reason
    WHERE vehicle_id = p_id AND type = 'vehicle_publication' AND status = 'pending';
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION propose_vehicle_change(p_vehicle_id uuid, p_payload jsonb, p_reason text)
RETURNS approval_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v vehicles;
  r approval_requests;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'administrator' THEN
    RAISE EXCEPTION 'only the Administrator can propose a vehicle change';
  END IF;
  SELECT * INTO v FROM vehicles WHERE id = p_vehicle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'vehicle not found';
  END IF;
  IF v.status NOT IN ('approved', 'available') THEN
    RAISE EXCEPTION 'draft vehicles can be edited directly';
  END IF;
  INSERT INTO approval_requests (type, vehicle_id, summary, payload, requested_by)
  VALUES (
    'vehicle_change',
    p_vehicle_id,
    coalesce(p_reason, 'Change to ' || v.stock_number),
    coalesce(p_payload, '{}'),
    auth.uid()
  )
  RETURNING * INTO r;
  RETURN r;
END;
$$;

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
    model       = CASE WHEN p ? 'model' THEN p ->> 'model' ELSE model END
  WHERE id = a.vehicle_id
  RETURNING * INTO v;
  UPDATE approval_requests
    SET status = 'approved', decided_by = auth.uid(), decided_at = now()
    WHERE id = p_id;
  RETURN v;
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
  END IF;
  RETURN a;
END;
$$;

CREATE OR REPLACE FUNCTION log_event(p_action text, p_table text, p_row uuid, p_after jsonb DEFAULT '{}')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_aal2() OR NOT is_active_staff() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  INSERT INTO audit_log (actor_id, actor_role, action, table_name, row_id, after)
  VALUES (auth.uid(), auth_role(), p_action, p_table, p_row, p_after);
END;
$$;

CREATE OR REPLACE FUNCTION consume_authorisation(p_authorisation_id uuid, p_user_id uuid, p_name text)
RETURNS staff_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a staff_authorisations;
  s staff_users;
BEGIN
  IF NOT is_aal2() OR auth_role() IS DISTINCT FROM 'administrator' THEN
    RAISE EXCEPTION 'only the Administrator can create a staff account';
  END IF;
  SELECT * INTO a FROM staff_authorisations WHERE id = p_authorisation_id FOR UPDATE;
  IF NOT FOUND OR a.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'no open CEO authorisation with that id';
  END IF;
  INSERT INTO staff_users (id, email, name, role, status, authorisation_id)
  VALUES (p_user_id, a.email, p_name, a.role, 'active', a.id)
  RETURNING * INTO s;
  UPDATE staff_authorisations
    SET status = 'consumed', consumed_at = now(), consumed_by = auth.uid()
    WHERE id = a.id;
  RETURN s;
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON staff_users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON staff_authorisations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON vehicles TO authenticated;
GRANT SELECT, INSERT ON vehicle_costs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON approval_requests TO authenticated;
GRANT SELECT ON audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE vehicle_stock_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE audit_log_id_seq TO authenticated;

GRANT EXECUTE ON FUNCTION is_aal2() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_active_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION next_stock_number() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_vehicle(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_vehicle(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION propose_vehicle_change(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_vehicle_change(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_approval(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_authorisation(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION log_event(text, text, uuid, jsonb) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON staff_users TO service_role;
GRANT SELECT, INSERT, UPDATE ON staff_authorisations TO service_role;
GRANT SELECT, INSERT, UPDATE ON vehicles TO service_role;
GRANT SELECT, INSERT ON vehicle_costs TO service_role;
GRANT SELECT, INSERT, UPDATE ON approval_requests TO service_role;
GRANT SELECT ON audit_log TO service_role;
GRANT EXECUTE ON FUNCTION consume_authorisation(uuid, uuid, text) TO service_role;

ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_authorisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Nobody, including service_role, should edit or delete the audit log from the API.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM authenticated, anon, service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON vehicle_costs FROM authenticated, anon, service_role;

CREATE POLICY staff_users_select ON staff_users
  FOR SELECT USING (is_aal2() AND is_active_staff());
CREATE POLICY staff_users_insert ON staff_users
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() = 'administrator');
CREATE POLICY staff_users_update ON staff_users
  FOR UPDATE USING (is_aal2() AND auth_role() = 'administrator')
  WITH CHECK (is_aal2() AND auth_role() = 'administrator');

CREATE POLICY staff_authz_select ON staff_authorisations
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY staff_authz_insert ON staff_authorisations
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() = 'ceo');
CREATE POLICY staff_authz_update ON staff_authorisations
  FOR UPDATE USING (is_aal2() AND auth_role() = 'ceo')
  WITH CHECK (is_aal2() AND auth_role() = 'ceo');

CREATE POLICY vehicles_select ON vehicles
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator', 'sales', 'finance'));
CREATE POLICY vehicles_insert ON vehicles
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY vehicles_update ON vehicles
  FOR UPDATE USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY vehicle_costs_select ON vehicle_costs
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'finance'));
CREATE POLICY vehicle_costs_insert ON vehicle_costs
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

CREATE POLICY approvals_select ON approval_requests
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY approvals_insert ON approval_requests
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY approvals_update ON approval_requests
  FOR UPDATE USING (is_aal2() AND auth_role() = 'ceo')
  WITH CHECK (is_aal2() AND auth_role() = 'ceo');

CREATE POLICY audit_select ON audit_log
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
