-- MOCK DATA FOR TESTS AND LOCAL DESIGN ONLY.
-- Never applied to production. Every vehicle is flagged is_mock = true.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed ids so tests can address them.
-- ceo / admin / sales / finance / deactivated / no2fa
-- TOTP secrets (base32) used by tests: see tests/helpers/fixtures.ts

CREATE OR REPLACE FUNCTION seed_auth_user(p_id uuid, p_email text, p_password text, p_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', p_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  );
END;
$$;

SELECT seed_auth_user('11111111-1111-1111-1111-111111111111', 'ceo@raptors.test', 'Test-CEO-2026!', 'CEO');
SELECT seed_auth_user('22222222-2222-2222-2222-222222222222', 'admin@raptors.test', 'Test-Admin-2026!', 'Administrator 01');
SELECT seed_auth_user('33333333-3333-3333-3333-333333333333', 'sales@raptors.test', 'Test-Sales-2026!', 'Sales 01');
SELECT seed_auth_user('44444444-4444-4444-4444-444444444444', 'finance@raptors.test', 'Test-Finance-2026!', 'Finance 01');
SELECT seed_auth_user('55555555-5555-5555-5555-555555555555', 'old@raptors.test', 'Test-Old-2026!!', 'Former staff');
SELECT seed_auth_user('66666666-6666-6666-6666-666666666666', 'no2fa@raptors.test', 'Test-No2fa-2026!', 'No two-step');

-- Verified authenticator factors. The no2fa user has none.
INSERT INTO auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Authenticator', 'totp', 'verified', now(), now(), 'JBSWY3DPEHPK3PXP'),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Authenticator', 'totp', 'verified', now(), now(), 'JBSWY3DPEHPK3PXQ'),
  ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Authenticator', 'totp', 'verified', now(), now(), 'JBSWY3DPEHPK3PXR'),
  ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Authenticator', 'totp', 'verified', now(), now(), 'JBSWY3DPEHPK3PXS'),
  ('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Authenticator', 'totp', 'verified', now(), now(), 'JBSWY3DPEHPK3PXT');

INSERT INTO staff_users (id, email, name, role, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ceo@raptors.test', 'CEO', 'ceo', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'admin@raptors.test', 'Administrator 01', 'administrator', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'sales@raptors.test', 'Sales 01', 'sales', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'finance@raptors.test', 'Finance 01', 'finance', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'old@raptors.test', 'Former staff', 'sales', 'deactivated'),
  ('66666666-6666-6666-6666-666666666666', 'no2fa@raptors.test', 'No two-step', 'administrator', 'active');

INSERT INTO staff_authorisations (id, email, role, status, created_by, notes)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'newstaff@raptors.test',
  'sales',
  'pending',
  '11111111-1111-1111-1111-111111111111',
  'MOCK DATA · open authorisation for tests'
);

-- Insert as drafts (the guard requires it), then move each record to its seed status.
INSERT INTO vehicles (
  id, stock_number, vin, year, make, model, body, fuel, transmission, drivetrain,
  engine, power, exterior, interior, mileage, title_status, location, price_cents,
  export_ready, status, notes, is_mock, created_by
) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'RA-0412', 'ZFF67NFA2D0189186', 2013, 'Ferrari', '458 Spider', 'Convertible', 'Gasoline', '7-speed automatic', 'RWD', '4.5L V8 DOHC', '562 hp', 'Blu Tour de France', 'Cuoio', 14200, 'clean', 'Miami, FL', 18950000, true, 'draft', 'MOCK DATA', true, '22222222-2222-2222-2222-222222222222'),
  ('b0000000-0000-0000-0000-000000000002', 'RA-0409', 'ZFF68NHA5E0201144', 2014, 'Ferrari', '458 Spider', 'Convertible', 'Gasoline', '7-speed automatic', 'RWD', '4.5L V8 DOHC', '562 hp', 'Rosso Corsa', 'Nero', 8900, 'clean', 'Houston, TX', 21200000, true, 'draft', 'MOCK DATA', true, '22222222-2222-2222-2222-222222222222'),
  ('b0000000-0000-0000-0000-000000000003', 'RA-0405', 'ZFF68NHA1C0187320', 2012, 'Ferrari', '458 Spider', 'Convertible', 'Gasoline', '7-speed automatic', 'RWD', '4.5L V8 DOHC', '562 hp', 'Argento Nürburgring', 'Nero', 21600, 'clean', 'Atlanta, GA', 17680000, false, 'draft', 'MOCK DATA', true, '22222222-2222-2222-2222-222222222222'),
  ('b0000000-0000-0000-0000-000000000004', 'RA-0401', 'ZFF68NHA9F0207718', 2015, 'Ferrari', '458 Spider', 'Convertible', 'Gasoline', '7-speed automatic', 'RWD', '4.5L V8 DOHC', '562 hp', 'Bianco Avus', 'Cuoio', 6300, 'clean', 'Newark, NJ', 22890000, true, 'draft', 'MOCK DATA', true, '22222222-2222-2222-2222-222222222222'),
  ('b0000000-0000-0000-0000-000000000005', 'RA-0398', 'ZFF67NFA6D0190012', 2013, 'Ferrari', '458 Spider', 'Convertible', 'Gasoline', '7-speed automatic', 'RWD', '4.5L V8 DOHC', '562 hp', 'Nero Daytona', 'Crema', 17700, 'clean', 'Los Angeles, CA', 19400000, true, 'draft', 'MOCK DATA', true, '22222222-2222-2222-2222-222222222222'),
  ('b0000000-0000-0000-0000-000000000006', 'RA-0396', 'ZFF68NHA3E0199841', 2014, 'Ferrari', '458 Spider', 'Convertible', 'Gasoline', '7-speed automatic', 'RWD', '4.5L V8 DOHC', '562 hp', 'Blu Pozzi', 'Sabbia', 11100, 'clean', 'Dallas, TX', 20550000, true, 'draft', 'MOCK DATA', true, '22222222-2222-2222-2222-222222222222');

SELECT set_config('raptors.allow_consequential_edit', 'on', true);

UPDATE vehicles SET status = 'submitted' WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE vehicles SET status = 'approved', approved_by = '11111111-1111-1111-1111-111111111111', approved_at = now()
  WHERE id = 'b0000000-0000-0000-0000-000000000003';
UPDATE vehicles SET status = 'approved', approved_by = '11111111-1111-1111-1111-111111111111', approved_at = now()
  WHERE id = 'b0000000-0000-0000-0000-000000000004';
UPDATE vehicles SET status = 'available' WHERE id = 'b0000000-0000-0000-0000-000000000004';
UPDATE vehicles SET status = 'withdrawn', withdrawn_reason = 'MOCK DATA · withdrawn for photos'
  WHERE id = 'b0000000-0000-0000-0000-000000000005';

INSERT INTO vehicle_costs (vehicle_id, kind, amount_cents, note, recorded_by)
VALUES
  ('b0000000-0000-0000-0000-000000000004', 'purchase', 19800000, 'MOCK DATA', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000004', 'transport', 65000, 'MOCK DATA', '22222222-2222-2222-2222-222222222222');

SELECT setval('vehicle_stock_seq', 413, false);

DROP FUNCTION seed_auth_user(uuid, text, text, text);
