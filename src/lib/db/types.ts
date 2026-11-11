export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StaffRole = "ceo" | "administrator" | "sales" | "finance";
export type StaffStatus = "active" | "deactivated";
export type AuthorisationStatus = "pending" | "consumed" | "revoked";
export type VehicleStatus = "draft" | "submitted" | "approved" | "available" | "reserved" | "sold" | "withdrawn";
export type TitleStatus = "clean" | "rebuilt" | "pending";
export type CostKind = "purchase" | "platform_fees" | "transport" | "repair" | "other";
export type ApprovalType = "vehicle_publication" | "vehicle_change" | "featured_selection" | "delivery_entry" | "quote_discount";
export type EnquiryKind = "quote_request" | "enquiry" | "information";
export type EnquiryStatus = "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost" | "spam";
export type ContactPreference = "email" | "whatsapp" | "phone";
export type DestinationStatus = "open" | "confirm_each_time" | "not_served";
export type QuoteStatus = "draft" | "previewed" | "sent" | "accepted" | "declined" | "expired" | "superseded";
export type QuoteLineKind =
  | "vehicle"
  | "raptors_fee"
  | "inland_transport"
  | "export_documents"
  | "ocean_freight"
  | "insurance"
  | "other"
  | "discount";
export type AcceptanceMethod = "email" | "whatsapp" | "phone" | "in_person";
export type TemplateStatus = "draft" | "approved";
export type TemplateAudience = "customer" | "staff";
export type NotificationStatus = "sent" | "failed" | "held";
export type ContentStatus = "draft" | "published";
export type ProposalStatus = "pending" | "approved" | "declined" | "withdrawn";
export type ApprovalStatus = "pending" | "approved" | "declined" | "cancelled";
export type MediaKind = "photo" | "spin" | "document" | "video";
export type MediaStatus = "pending" | "processing" | "ready" | "failed";
export type DocumentKind = "history" | "inspection" | "title" | "other";
export type MediaVisibility = "public" | "internal";
export type VideoProvider = "link" | "mux";

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  authorisation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffAuthorisation = {
  id: string;
  email: string;
  role: Exclude<StaffRole, "ceo">;
  status: AuthorisationStatus;
  created_by: string | null;
  created_at: string;
  consumed_at: string | null;
  consumed_by: string | null;
  notes: string | null;
};

export type Vehicle = {
  id: string;
  slug: string;
  stock_number: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  body: string | null;
  fuel: string | null;
  transmission: string | null;
  drivetrain: string | null;
  engine: string | null;
  power: string | null;
  exterior: string | null;
  interior: string | null;
  mileage: number;
  title_status: TitleStatus;
  location: string | null;
  price_cents: number;
  currency: "USD";
  export_ready: boolean;
  status: VehicleStatus;
  withdrawn_reason: string | null;
  notes: string | null;
  is_mock: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  description: string | null;
  features: string[];
};

/** Columns an anonymous visitor can read. Costs, notes and staff fields are absent. */
export type PublicVehicle = {
  id: string;
  slug: string;
  stock_number: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  body: string | null;
  fuel: string | null;
  transmission: string | null;
  drivetrain: string | null;
  engine: string | null;
  power: string | null;
  exterior: string | null;
  interior: string | null;
  mileage: number;
  title_status: TitleStatus;
  location: string | null;
  price_cents: number;
  currency: "USD";
  export_ready: boolean;
  status: "available" | "reserved" | "sold";
  created_at: string;
  approved_at: string | null;
  description: string | null;
  features: string[];
};

/** A published rendition or a public history/inspection file. Paths and Mux ids are absent. */
export type PublicMedia = {
  id: string;
  vehicle_id: string;
  kind: MediaKind;
  sort_order: number;
  frame_index: number | null;
  is_cover: boolean;
  flaw_label: string | null;
  alt_text: string | null;
  document_kind: DocumentKind | null;
  visibility: MediaVisibility | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  video_url: string | null;
  status: MediaStatus;
};

export type VehicleCost = {
  id: string;
  vehicle_id: string;
  kind: CostKind;
  amount_cents: number;
  currency: "USD";
  note: string | null;
  corrects_id: string | null;
  recorded_by: string | null;
  recorded_at: string;
};

export type ApprovalRequest = {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  vehicle_id: string | null;
  summary: string;
  payload: Json;
  requested_by: string | null;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decline_reason: string | null;
};

export type VehicleMedia = {
  id: string;
  vehicle_id: string;
  kind: MediaKind;
  status: MediaStatus;
  sort_order: number;
  frame_index: number | null;
  is_cover: boolean;
  flaw_label: string | null;
  alt_text: string | null;
  document_kind: DocumentKind | null;
  visibility: MediaVisibility;
  original_path: string | null;
  rendition_path: string | null;
  thumb_path: string | null;
  mime_type: string | null;
  byte_size: number | null;
  rendition_bytes: number | null;
  width: number | null;
  height: number | null;
  error: string | null;
  video_provider: VideoProvider | null;
  video_url: string | null;
  mux_upload_id: string | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteSettings = {
  id: string;
  singleton: boolean;
  legal_name: string | null;
  licence: string | null;
  city: string | null;
  year_started: number | null;
  whatsapp_e164: string | null;
  quote_discount_limit_cents: number | null;
  updated_at: string;
  updated_by: string | null;
};

export type PublicSiteSettings = {
  legal_name: string | null;
  licence: string | null;
  city: string | null;
  year_started: number | null;
  whatsapp_e164: string | null;
};

export type SitePage = {
  id: string;
  slug: "about" | "contact" | "legal";
  title: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
  status: ContentStatus;
  updated_at: string;
  updated_by: string | null;
};

export type PublicSitePage = {
  slug: string;
  title: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
};

export type Guide = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  topic: string | null;
  confirmed_on: string | null;
  minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicGuide = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  topic: string | null;
  confirmed_on: string | null;
  minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type DealerPlatform = {
  id: string;
  name: string;
  status: ContentStatus;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicPlatform = {
  id: string;
  name: string;
  sort_order: number;
};

export type FeaturedSelection = {
  id: string;
  vehicle_id: string;
  status: ProposalStatus;
  sort_order: number;
  proposed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicFeatured = {
  id: string;
  sort_order: number;
  approved_at: string | null;
  vehicle_id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  exterior: string | null;
  location: string | null;
  status: "available" | "reserved" | "sold";
};

export type DeliveryEntry = {
  id: string;
  title: string;
  place: string;
  status: ProposalStatus;
  proposed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicDelivery = {
  id: string;
  title: string;
  place: string;
  approved_at: string | null;
};

export type PublicSoldStrip = {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  location: string | null;
  exterior: string | null;
  cover_media_id: string | null;
};

export type Destination = {
  id: string;
  country: string;
  port: string;
  status: DestinationStatus;
  notes: string | null;
  status_set_by: string | null;
  status_set_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicDestination = Pick<Destination, "id" | "country" | "port" | "status">;

export type Customer = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  country: string | null;
  preferred_contact: ContactPreference;
  created_at: string;
  updated_at: string;
};

export type Enquiry = {
  id: string;
  reference: string;
  kind: EnquiryKind;
  customer_id: string;
  vehicle_id: string | null;
  destination_id: string | null;
  destination_other: string | null;
  message: string | null;
  preferred_contact: ContactPreference;
  status: EnquiryStatus;
  assigned_to: string | null;
  first_response_at: string | null;
  source_path: string | null;
  created_at: string;
  updated_at: string;
};

export type EnquiryEvent = {
  id: string;
  enquiry_id: string;
  kind: "received" | "status" | "assigned" | "note" | "quote";
  from_status: EnquiryStatus | null;
  to_status: EnquiryStatus | null;
  note: string | null;
  actor_id: string | null;
  at: string;
};

export type Quote = {
  id: string;
  number: string | null;
  enquiry_id: string | null;
  customer_id: string;
  vehicle_id: string;
  destination_id: string | null;
  shipping_method: "container" | "roro" | null;
  destination_confirmed_by: string | null;
  destination_confirmed_at: string | null;
  valid_until: string;
  not_included: string;
  customer_note: string | null;
  status: QuoteStatus;
  revision: number;
  previewed_revision: number | null;
  supersedes_id: string | null;
  prepared_by: string | null;
  sent_at: string | null;
  sent_by: string | null;
  sent_to: string | null;
  pdf_path: string | null;
  accepted_on: string | null;
  accepted_by: string | null;
  acceptance_method: AcceptanceMethod | null;
  acceptance_note: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  invoice_status: "to_prepare" | null;
  created_at: string;
  updated_at: string;
};

export type QuoteLine = {
  id: string;
  quote_id: string;
  kind: QuoteLineKind;
  label: string;
  amount_cents: number;
  currency: "USD";
  position: number;
};

export type QuoteLocalCharge = {
  id: string;
  quote_id: string;
  label: string;
  estimate_cents: number | null;
  currency: "USD";
  note: string | null;
  position: number;
};

export type EmailTemplate = {
  id: string;
  key: string;
  version: number;
  audience: TemplateAudience;
  name: string;
  subject: string;
  eyebrow: string | null;
  heading: string;
  body: string;
  button_label: string | null;
  status: TemplateStatus;
  created_by: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
};

export type NotificationLogEntry = {
  id: string;
  at: string;
  template_key: string;
  template_version: number | null;
  audience: TemplateAudience;
  to_email: string;
  subject: string;
  status: NotificationStatus;
  provider: "resend" | "mailpit" | "none";
  provider_id: string | null;
  error: string | null;
  is_test: boolean;
  enquiry_id: string | null;
  quote_id: string | null;
  sent_by: string | null;
};

export type AuditEntry = {
  id: number;
  at: string;
  actor_id: string | null;
  actor_role: StaffRole | null;
  action: string;
  table_name: string;
  row_id: string | null;
  before: Json | null;
  after: Json | null;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      staff_users: Table<StaffUser, Partial<StaffUser> & Pick<StaffUser, "id" | "email" | "name" | "role">, Partial<StaffUser>>;
      staff_authorisations: Table<StaffAuthorisation, Partial<StaffAuthorisation> & Pick<StaffAuthorisation, "email" | "role">, Partial<StaffAuthorisation>>;
      vehicles: Table<Vehicle, Partial<Vehicle> & Pick<Vehicle, "vin" | "year" | "make" | "model" | "price_cents">, Partial<Vehicle>>;
      vehicle_costs: Table<VehicleCost, Partial<VehicleCost> & Pick<VehicleCost, "vehicle_id" | "kind" | "amount_cents">, Partial<VehicleCost>>;
      approval_requests: Table<ApprovalRequest, Partial<ApprovalRequest> & Pick<ApprovalRequest, "type" | "summary">, Partial<ApprovalRequest>>;
      audit_log: Table<AuditEntry, never, never>;
      vehicle_media: Table<
        VehicleMedia,
        Partial<VehicleMedia> & Pick<VehicleMedia, "vehicle_id" | "kind">,
        Partial<VehicleMedia>
      >;
      public_vehicles: Table<PublicVehicle, never, never>;
      public_vehicle_media: Table<PublicMedia, never, never>;
      site_settings: Table<SiteSettings, Partial<SiteSettings>, Partial<SiteSettings>>;
      dealer_platforms: Table<DealerPlatform, Partial<DealerPlatform> & Pick<DealerPlatform, "name">, Partial<DealerPlatform>>;
      site_pages: Table<SitePage, Partial<SitePage> & Pick<SitePage, "slug" | "title">, Partial<SitePage>>;
      guides: Table<Guide, Partial<Guide> & Pick<Guide, "slug" | "title">, Partial<Guide>>;
      faqs: Table<Faq, Partial<Faq> & Pick<Faq, "question">, Partial<Faq>>;
      featured_selections: Table<FeaturedSelection, Partial<FeaturedSelection> & Pick<FeaturedSelection, "vehicle_id">, Partial<FeaturedSelection>>;
      delivery_entries: Table<DeliveryEntry, Partial<DeliveryEntry> & Pick<DeliveryEntry, "title" | "place">, Partial<DeliveryEntry>>;
      public_site_settings: Table<PublicSiteSettings, never, never>;
      public_site_pages: Table<PublicSitePage, never, never>;
      public_guides: Table<PublicGuide, never, never>;
      public_faqs: Table<PublicFaq, never, never>;
      public_platforms: Table<PublicPlatform, never, never>;
      public_featured: Table<PublicFeatured, never, never>;
      public_deliveries: Table<PublicDelivery, never, never>;
      public_sold_strip: Table<PublicSoldStrip, never, never>;
      public_destinations: Table<PublicDestination, never, never>;
      destinations: Table<Destination, Partial<Destination> & Pick<Destination, "country" | "port">, Partial<Destination>>;
      customers: Table<Customer, never, Partial<Customer>>;
      enquiries: Table<Enquiry, never, Partial<Enquiry>>;
      enquiry_events: Table<EnquiryEvent, Partial<EnquiryEvent> & Pick<EnquiryEvent, "enquiry_id" | "kind">, never>;
      quotes: Table<Quote, never, Partial<Quote>>;
      quote_lines: Table<QuoteLine, Partial<QuoteLine> & Pick<QuoteLine, "quote_id" | "kind" | "label" | "amount_cents">, Partial<QuoteLine>>;
      quote_local_charges: Table<
        QuoteLocalCharge,
        Partial<QuoteLocalCharge> & Pick<QuoteLocalCharge, "quote_id" | "label">,
        Partial<QuoteLocalCharge>
      >;
      email_templates: Table<
        EmailTemplate,
        Partial<EmailTemplate> & Pick<EmailTemplate, "key" | "audience" | "name" | "subject" | "heading" | "body">,
        Partial<EmailTemplate>
      >;
      notification_log: Table<
        NotificationLogEntry,
        Partial<NotificationLogEntry> &
          Pick<NotificationLogEntry, "template_key" | "audience" | "to_email" | "subject" | "status" | "provider">,
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      approve_vehicle: { Args: { p_id: string }; Returns: Vehicle };
      decline_vehicle: { Args: { p_id: string; p_reason: string }; Returns: Vehicle };
      propose_vehicle_change: { Args: { p_vehicle_id: string; p_payload: Json; p_reason: string }; Returns: ApprovalRequest };
      approve_vehicle_change: { Args: { p_id: string }; Returns: Vehicle };
      decline_approval: { Args: { p_id: string; p_reason: string }; Returns: ApprovalRequest };
      propose_featured: { Args: { p_vehicle_id: string }; Returns: FeaturedSelection };
      approve_featured: { Args: { p_id: string }; Returns: FeaturedSelection };
      withdraw_featured: { Args: { p_id: string }; Returns: FeaturedSelection };
      propose_delivery: { Args: { p_title: string; p_place: string }; Returns: DeliveryEntry };
      approve_delivery: { Args: { p_id: string }; Returns: DeliveryEntry };
      withdraw_delivery: { Args: { p_id: string }; Returns: DeliveryEntry };
      consume_authorisation: { Args: { p_authorisation_id: string; p_user_id: string; p_name: string }; Returns: StaffUser };
      log_event: { Args: { p_action: string; p_table: string; p_row: string; p_after?: Json }; Returns: undefined };
      next_stock_number: { Args: Record<string, never>; Returns: string };
      auth_role: { Args: Record<string, never>; Returns: StaffRole };
      is_aal2: { Args: Record<string, never>; Returns: boolean };
      begin_media_upload: {
        Args: {
          p_vehicle_id: string;
          p_kind: MediaKind;
          p_mime: string;
          p_alt: string;
          p_document_kind?: DocumentKind | null;
          p_visibility?: MediaVisibility;
        };
        Returns: VehicleMedia;
      };
      reorder_vehicle_media: {
        Args: { p_vehicle_id: string; p_kind: MediaKind; p_ids: string[] };
        Returns: undefined;
      };
      submit_enquiry: {
        Args: {
          p_kind: EnquiryKind;
          p_name: string;
          p_email: string;
          p_whatsapp: string | null;
          p_preferred: ContactPreference;
          p_vehicle_id: string | null;
          p_destination_id: string | null;
          p_destination_other: string | null;
          p_message: string | null;
          p_rate_key: string;
          p_source_path: string | null;
        };
        Returns: { enquiry_id: string; reference: string }[];
      };
      create_quote: { Args: { p_enquiry_id: string; p_destination_id: string | null }; Returns: Quote };
      preview_quote: { Args: { p_id: string }; Returns: Quote };
      send_quote: { Args: { p_id: string }; Returns: Quote };
      attach_quote_pdf: { Args: { p_id: string; p_path: string }; Returns: Quote };
      expire_quotes: { Args: Record<string, never>; Returns: number };
      record_quote_acceptance: {
        Args: { p_id: string; p_method: AcceptanceMethod; p_accepted_on: string; p_note: string | null };
        Returns: Quote;
      };
      record_quote_declined: { Args: { p_id: string; p_reason: string }; Returns: Quote };
      new_quote_version: { Args: { p_id: string }; Returns: Quote };
      request_quote_discount: { Args: { p_quote_id: string }; Returns: ApprovalRequest };
      approve_quote_discount: { Args: { p_id: string }; Returns: ApprovalRequest };
      quote_problems: { Args: { p_id: string }; Returns: { reason: string }[] };
      quote_blocking_reasons: { Args: { p_id: string }; Returns: { reason: string }[] };
      quote_total_cents: { Args: { p_id: string }; Returns: number };
      quote_discount_cents: { Args: { p_id: string }; Returns: number };
    };
    Enums: {
      staff_role: StaffRole;
      staff_status: StaffStatus;
      authorisation_status: AuthorisationStatus;
      vehicle_status: VehicleStatus;
      title_status: TitleStatus;
      cost_kind: CostKind;
      approval_type: ApprovalType;
      approval_status: ApprovalStatus;
      media_kind: MediaKind;
      media_status: MediaStatus;
      document_kind: DocumentKind;
      media_visibility: MediaVisibility;
      video_provider: VideoProvider;
      content_status: ContentStatus;
      enquiry_kind: EnquiryKind;
      enquiry_status: EnquiryStatus;
      contact_preference: ContactPreference;
      destination_status: DestinationStatus;
      quote_status: QuoteStatus;
      quote_line_kind: QuoteLineKind;
      acceptance_method: AcceptanceMethod;
      template_status: TemplateStatus;
      template_audience: TemplateAudience;
      notification_status: NotificationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
