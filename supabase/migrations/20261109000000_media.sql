-- Milestone 3: private vehicle media. Originals are never public.
-- Title images cannot be marked for the future public page.
-- The audit trigger records the row, not the file bytes.

CREATE TYPE media_kind AS ENUM ('photo', 'spin', 'document', 'video');
CREATE TYPE media_status AS ENUM ('pending', 'processing', 'ready', 'failed');
CREATE TYPE document_kind AS ENUM ('history', 'inspection', 'title', 'other');
CREATE TYPE media_visibility AS ENUM ('public', 'internal');
CREATE TYPE video_provider AS ENUM ('link', 'mux');

CREATE TABLE vehicle_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  kind media_kind NOT NULL,
  status media_status NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,
  frame_index integer,
  is_cover boolean NOT NULL DEFAULT false,
  flaw_label text,
  alt_text text,
  document_kind document_kind,
  visibility media_visibility NOT NULL DEFAULT 'internal',
  original_path text,
  rendition_path text,
  thumb_path text,
  mime_type text,
  byte_size bigint,
  rendition_bytes bigint,
  width integer,
  height integer,
  error text,
  video_provider video_provider,
  video_url text,
  mux_upload_id text,
  mux_asset_id text,
  mux_playback_id text,
  created_by uuid REFERENCES staff_users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spin_needs_frame CHECK (kind <> 'spin' OR status = 'failed' OR frame_index IS NOT NULL),
  CONSTRAINT document_needs_kind CHECK (kind <> 'document' OR document_kind IS NOT NULL),
  CONSTRAINT document_kind_only_on_documents CHECK (kind = 'document' OR document_kind IS NULL),
  CONSTRAINT title_is_internal CHECK (document_kind IS DISTINCT FROM 'title' OR visibility = 'internal'),
  CONSTRAINT visibility_only_on_documents CHECK (kind = 'document' OR visibility = 'internal'),
  CONSTRAINT cover_is_photo CHECK (NOT is_cover OR kind = 'photo'),
  CONSTRAINT flaw_is_photo CHECK (flaw_label IS NULL OR kind = 'photo'),
  CONSTRAINT flaw_label_length CHECK (flaw_label IS NULL OR char_length(flaw_label) <= 120),
  CONSTRAINT video_needs_provider CHECK (kind <> 'video' OR video_provider IS NOT NULL),
  CONSTRAINT link_needs_url CHECK (video_provider IS DISTINCT FROM 'link' OR video_url IS NOT NULL),
  CONSTRAINT video_url_https CHECK (video_url IS NULL OR video_url ~ '^https://'),
  CONSTRAINT video_url_length CHECK (video_url IS NULL OR char_length(video_url) <= 2000),
  CONSTRAINT byte_size_nonneg CHECK (byte_size IS NULL OR byte_size >= 0),
  CONSTRAINT rendition_bytes_nonneg CHECK (rendition_bytes IS NULL OR rendition_bytes >= 0)
);

CREATE UNIQUE INDEX vehicle_media_one_cover ON vehicle_media (vehicle_id) WHERE is_cover;
CREATE UNIQUE INDEX vehicle_media_spin_frame ON vehicle_media (vehicle_id, frame_index) WHERE kind = 'spin';
CREATE INDEX vehicle_media_vehicle_idx ON vehicle_media (vehicle_id, kind, sort_order);
CREATE INDEX vehicle_media_failed_idx ON vehicle_media (created_at DESC) WHERE status = 'failed';

CREATE TRIGGER vehicle_media_updated_at
  BEFORE UPDATE ON vehicle_media
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER vehicle_media_audit
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_media
  FOR EACH ROW EXECUTE FUNCTION audit_row();

-- When the cover photo is removed, the earliest remaining photo becomes the cover.
CREATE OR REPLACE FUNCTION vehicle_media_cover_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.kind = 'photo' AND OLD.is_cover THEN
    UPDATE vehicle_media
    SET is_cover = true
    WHERE id = (
      SELECT id FROM vehicle_media
      WHERE vehicle_id = OLD.vehicle_id AND kind = 'photo'
      ORDER BY sort_order, created_at
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER vehicle_media_cover_after_delete
  AFTER DELETE ON vehicle_media
  FOR EACH ROW EXECUTE FUNCTION vehicle_media_cover_after_delete();

-- Assigns the next position under a lock so parallel uploads cannot take the same frame.
CREATE OR REPLACE FUNCTION begin_media_upload(
  p_vehicle_id uuid,
  p_kind media_kind,
  p_mime text,
  p_alt text,
  p_document_kind document_kind DEFAULT NULL,
  p_visibility media_visibility DEFAULT 'internal'
)
RETURNS vehicle_media
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v vehicle_media;
  next_pos integer;
  make_cover boolean;
BEGIN
  IF NOT is_aal2() OR auth_role() NOT IN ('ceo', 'administrator') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  PERFORM 1 FROM vehicles WHERE id = p_vehicle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'vehicle not found';
  END IF;

  IF p_kind = 'document' AND p_document_kind IS NULL THEN
    RAISE EXCEPTION 'choose a document type';
  END IF;
  IF p_kind = 'document' AND p_document_kind = 'title' AND p_visibility IS DISTINCT FROM 'internal' THEN
    RAISE EXCEPTION 'title images are private';
  END IF;
  IF p_kind <> 'document' AND p_visibility IS DISTINCT FROM 'internal' THEN
    RAISE EXCEPTION 'only documents can be marked for the future vehicle page';
  END IF;

  IF p_kind = 'spin' THEN
    SELECT coalesce(max(frame_index), 0) + 1 INTO next_pos
    FROM vehicle_media
    WHERE vehicle_id = p_vehicle_id AND kind = 'spin';
  ELSE
    SELECT coalesce(max(sort_order), 0) + 1 INTO next_pos
    FROM vehicle_media
    WHERE vehicle_id = p_vehicle_id AND kind = p_kind;
  END IF;

  make_cover := p_kind = 'photo' AND NOT EXISTS (
    SELECT 1 FROM vehicle_media WHERE vehicle_id = p_vehicle_id AND kind = 'photo' AND is_cover
  );

  INSERT INTO vehicle_media (
    vehicle_id, kind, status, sort_order, frame_index, is_cover, alt_text,
    document_kind, visibility, mime_type, created_by
  ) VALUES (
    p_vehicle_id,
    p_kind,
    'pending',
    CASE WHEN p_kind = 'spin' THEN next_pos ELSE next_pos END,
    CASE WHEN p_kind = 'spin' THEN next_pos ELSE NULL END,
    make_cover,
    NULLIF(left(btrim(p_alt), 120), ''),
    CASE WHEN p_kind = 'document' THEN p_document_kind ELSE NULL END,
    CASE WHEN p_kind = 'document' THEN p_visibility ELSE 'internal' END,
    p_mime,
    auth.uid()
  ) RETURNING * INTO v;

  UPDATE vehicle_media
  SET original_path = p_vehicle_id::text || '/' || v.id::text || '/original'
  WHERE id = v.id
  RETURNING * INTO v;

  RETURN v;
END;
$$;

-- First photo in the list is the cover. Spin frames are numbered in the same order.
CREATE OR REPLACE FUNCTION reorder_vehicle_media(
  p_vehicle_id uuid,
  p_kind media_kind,
  p_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  n integer;
  i integer;
BEGIN
  IF NOT is_aal2() OR auth_role() NOT IN ('ceo', 'administrator') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF p_kind NOT IN ('photo', 'spin') THEN
    RAISE EXCEPTION 'only photos and 360 frames can be reordered';
  END IF;

  PERFORM 1 FROM vehicles WHERE id = p_vehicle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'vehicle not found';
  END IF;

  n := coalesce(array_length(p_ids, 1), 0);
  IF n = 0 THEN
    RAISE EXCEPTION 'the order is empty';
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(p_ids) AS x) <> n THEN
    RAISE EXCEPTION 'duplicate ids in the order';
  END IF;
  IF (SELECT count(*) FROM vehicle_media WHERE vehicle_id = p_vehicle_id AND kind = p_kind AND id = ANY (p_ids)) <> n THEN
    RAISE EXCEPTION 'the order does not match this vehicle';
  END IF;
  IF (SELECT count(*) FROM vehicle_media WHERE vehicle_id = p_vehicle_id AND kind = p_kind) <> n THEN
    RAISE EXCEPTION 'the order must include every item';
  END IF;

  FOR i IN 1..n LOOP
    UPDATE vehicle_media
    SET sort_order = -i,
        frame_index = CASE WHEN p_kind = 'spin' THEN -i ELSE frame_index END,
        is_cover = false
    WHERE id = p_ids[i];
  END LOOP;

  FOR i IN 1..n LOOP
    UPDATE vehicle_media
    SET sort_order = i,
        frame_index = CASE WHEN p_kind = 'spin' THEN i ELSE NULL END,
        is_cover = (p_kind = 'photo' AND i = 1)
    WHERE id = p_ids[i];
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION begin_media_upload(uuid, media_kind, text, text, document_kind, media_visibility) FROM PUBLIC;
REVOKE ALL ON FUNCTION reorder_vehicle_media(uuid, media_kind, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION begin_media_upload(uuid, media_kind, text, text, document_kind, media_visibility) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_vehicle_media(uuid, media_kind, uuid[]) TO authenticated;

REVOKE ALL ON vehicle_media FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_media TO service_role;

ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_media_select ON vehicle_media
  FOR SELECT USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY vehicle_media_insert ON vehicle_media
  FOR INSERT WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY vehicle_media_update ON vehicle_media
  FOR UPDATE USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'))
  WITH CHECK (is_aal2() AND auth_role() IN ('ceo', 'administrator'));
CREATE POLICY vehicle_media_delete ON vehicle_media
  FOR DELETE USING (is_aal2() AND auth_role() IN ('ceo', 'administrator'));

-- Private buckets. Renditions are written by the server; staff may read them.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media-originals', 'media-originals', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('media-renditions', 'media-renditions', false, 52428800, ARRAY['image/webp']),
  ('media-documents', 'media-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

CREATE OR REPLACE FUNCTION storage_media_staff(bucket text, object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bucket IN ('media-originals', 'media-renditions', 'media-documents')
    AND is_aal2()
    AND auth_role() IN ('ceo', 'administrator')
    AND (storage.foldername(object_name))[1] ~ '^[0-9a-fA-F-]{36}$';
$$;

REVOKE ALL ON FUNCTION storage_media_staff(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION storage_media_staff(text, text) TO authenticated;

CREATE POLICY media_staff_select ON storage.objects
  FOR SELECT TO authenticated
  USING (storage_media_staff(bucket_id, name));

CREATE POLICY media_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('media-originals', 'media-documents')
    AND storage_media_staff(bucket_id, name)
  );

CREATE POLICY media_staff_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('media-originals', 'media-documents')
    AND storage_media_staff(bucket_id, name)
  )
  WITH CHECK (
    bucket_id IN ('media-originals', 'media-documents')
    AND storage_media_staff(bucket_id, name)
  );

CREATE POLICY media_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('media-originals', 'media-documents')
    AND storage_media_staff(bucket_id, name)
  );
