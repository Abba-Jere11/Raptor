-- The first version of this guard read columns that only exist on some tables.
-- Postgres can evaluate both sides of AND, so those reads failed on other tables.

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
  IF TG_TABLE_NAME = 'guides' THEN
    IF NEW.status = 'published' AND NEW.confirmed_on IS NULL THEN
      RAISE EXCEPTION 'a guide needs the date it was last confirmed';
    END IF;
    IF NEW.status = 'published' AND length(trim(NEW.body)) = 0 THEN
      RAISE EXCEPTION 'a guide needs wording before it is published';
    END IF;
  ELSIF TG_TABLE_NAME = 'site_pages' THEN
    IF NEW.status = 'published' AND length(trim(NEW.body)) = 0 THEN
      RAISE EXCEPTION 'a page needs wording before it is published';
    END IF;
  ELSIF TG_TABLE_NAME = 'faqs' THEN
    IF NEW.status = 'published' AND length(trim(NEW.answer)) = 0 THEN
      RAISE EXCEPTION 'a question needs an answer before it is published';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
