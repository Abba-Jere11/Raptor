-- submit_enquiry is called only by the Next.js server with the service role.
-- Anonymous visitors and signed-in staff never call it directly.
REVOKE ALL ON FUNCTION submit_enquiry(enquiry_kind, text, text, text, contact_preference, uuid, uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_enquiry(enquiry_kind, text, text, text, contact_preference, uuid, uuid, text, text, text, text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
