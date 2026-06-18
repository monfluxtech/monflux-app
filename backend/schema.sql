-- ============================================================
-- MONFLUX 2.0 — Schéma PostgreSQL complet
-- Version: 2.0.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role          AS ENUM ('owner','admin','estimator','site_manager','worker','subcontractor','client_viewer');
CREATE TYPE company_sector     AS ENUM ('residential','commercial','industrial','mixed');
CREATE TYPE company_size       AS ENUM ('solo','2_5','6_10','11_25','26_50','50_plus');
CREATE TYPE profile_type       AS ENUM ('company','individual','member');
CREATE TYPE plan_slug          AS ENUM ('free','pro','business','enterprise');
CREATE TYPE sub_status         AS ENUM ('active','trialing','past_due','cancelled','paused');
CREATE TYPE invite_status      AS ENUM ('pending','accepted','expired','revoked');
CREATE TYPE lead_status        AS ENUM ('new','contacted','quote_sent','won','lost','archived');
CREATE TYPE lead_source        AS ENUM ('manual','email','whatsapp','facebook_ads','google_lsa','soumissions_reno','kijiji','referral','website','other');
CREATE TYPE contact_type       AS ENUM ('client','subcontractor','supplier','partner','prospect');
CREATE TYPE project_status     AS ENUM ('lead','quote','active','on_hold','completed','cancelled');
CREATE TYPE project_type       AS ENUM ('kitchen','bathroom','basement','addition','new_build','roofing','exterior','commercial','interior','other');
CREATE TYPE phase_status       AS ENUM ('not_started','in_progress','delayed','completed','cancelled');
CREATE TYPE milestone_type     AS ENUM ('billing','inspection','delivery','sign_off','other');
CREATE TYPE quote_status       AS ENUM ('draft','sent','viewed','signed','expired','rejected','converted');
CREATE TYPE contract_status    AS ENUM ('draft','sent','signed','active','completed','cancelled');
CREATE TYPE co_status          AS ENUM ('draft','pending_approval','approved','rejected','invoiced');
CREATE TYPE invoice_status     AS ENUM ('draft','sent','viewed','partial','paid','overdue','cancelled','void');
CREATE TYPE payment_method_t   AS ENUM ('stripe','paypal','credit_card','e_transfer','cash','cheque','other');
CREATE TYPE payment_status_t   AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE rfq_status         AS ENUM ('open','closed','awarded','cancelled');
CREATE TYPE punch_method       AS ENUM ('qr','geolocation','manual');
CREATE TYPE doc_type           AS ENUM ('plan','photo','contract','invoice','quote','change_order','permit','other');
CREATE TYPE integration_type   AS ENUM ('whatsapp','gmail','outlook','stripe_connect','facebook_ads','google_lsa','quickbooks','other');
CREATE TYPE integration_status AS ENUM ('connected','disconnected','error','pending');
CREATE TYPE action_status      AS ENUM ('pending','approved','dismissed','executed');
CREATE TYPE action_source      AS ENUM ('email','whatsapp','sms','system','ai');

-- ============================================================
-- 01. PLANS & FORFAITS
-- ============================================================

CREATE TABLE plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             plan_slug UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  base_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_seat_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  included_seats   INT NOT NULL DEFAULT 1,
  max_projects     INT,           -- NULL = illimité
  max_users        INT,
  features         JSONB NOT NULL DEFAULT '{}',
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (slug, name, base_price, per_seat_price, included_seats, max_projects, max_users, features) VALUES
('free', 'Gratuit', 0, 0, 1, 2, 1, '{
  "ai_onboarding":false,"ai_estimation":false,"ai_health_check":false,"ai_chat":false,
  "whatsapp":false,"gmail":false,"qr_punch":true,"subcontractors":true,"rfq":false,
  "invoicing":false,"stripe_payments":false,"plans_upload":false,"ocr":false,
  "interactive_quote":false,"lead_sources":false,"volume_discounts":false,
  "custom_fields":false,"automations":false,"reports":false,"watermark":true,
  "max_qr_sites":1,"max_leads":10,"max_subcontractors":5
}'),
('pro', 'Pro', 49, 29, 1, NULL, NULL, '{
  "ai_onboarding":true,"ai_estimation":true,"ai_health_check":true,"ai_chat":true,
  "whatsapp":true,"gmail":false,"qr_punch":true,"subcontractors":true,"rfq":true,
  "invoicing":true,"stripe_payments":true,"plans_upload":true,"ocr":true,
  "interactive_quote":true,"lead_sources":true,"volume_discounts":true,
  "custom_fields":false,"automations":false,"reports":true,"watermark":false,
  "max_qr_sites":null,"max_leads":null,"max_subcontractors":null
}'),
('business', 'Business', 99, 25, 3, NULL, NULL, '{
  "ai_onboarding":true,"ai_estimation":true,"ai_health_check":true,"ai_chat":true,
  "whatsapp":true,"gmail":true,"qr_punch":true,"subcontractors":true,"rfq":true,
  "invoicing":true,"stripe_payments":true,"plans_upload":true,"ocr":true,
  "interactive_quote":true,"lead_sources":true,"volume_discounts":true,
  "custom_fields":true,"automations":true,"reports":true,"watermark":false,
  "max_qr_sites":null,"max_leads":null,"max_subcontractors":null
}'),
('enterprise', 'Entreprise', 179, 20, 10, NULL, NULL, '{
  "ai_onboarding":true,"ai_estimation":true,"ai_health_check":true,"ai_chat":true,
  "whatsapp":true,"gmail":true,"qr_punch":true,"subcontractors":true,"rfq":true,
  "invoicing":true,"stripe_payments":true,"plans_upload":true,"ocr":true,
  "interactive_quote":true,"lead_sources":true,"volume_discounts":true,
  "custom_fields":true,"automations":true,"reports":true,"watermark":false,
  "api_access":true,"priority_support":true,
  "max_qr_sites":null,"max_leads":null,"max_subcontractors":null
}');

-- ============================================================
-- 02. USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  name            TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  language        TEXT DEFAULT 'fr',
  google_id       TEXT UNIQUE,
  facebook_id     TEXT UNIQUE,
  apple_id        TEXT UNIQUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  landing_pref    TEXT DEFAULT 'dashboard',  -- 'dashboard' | 'chat'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 03. COMPANIES & MEMBRES
-- ============================================================

CREATE TABLE companies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  rbq_number           TEXT,
  neq_number           TEXT,
  logo_url             TEXT,
  address              TEXT,
  city                 TEXT,
  province             TEXT DEFAULT 'QC',
  postal_code          TEXT,
  phone                TEXT,
  email                TEXT,
  website              TEXT,
  sector               company_sector DEFAULT 'residential',
  size                 company_size DEFAULT 'solo',
  profile_type         profile_type DEFAULT 'company',
  tps_number           TEXT,
  tvq_number           TEXT,
  default_deposit_pct  NUMERIC(5,2) DEFAULT 30,
  payment_terms_days   INT DEFAULT 30,
  modules_enabled      JSONB DEFAULT '["leads","quotes","projects","invoicing","subcontractors","punch"]',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_profile   JSONB,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'worker',
  is_owner    BOOLEAN DEFAULT FALSE,
  invited_by  UUID REFERENCES users(id),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES users(id),
  email       TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  role        user_role NOT NULL DEFAULT 'worker',
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  qr_code_url TEXT,
  status      invite_status DEFAULT 'pending',
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 04. ABONNEMENTS + ⚡ MODE DEV
-- ============================================================

CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id                UUID NOT NULL REFERENCES plans(id),
  status                 sub_status DEFAULT 'active',
  seats                  INT NOT NULL DEFAULT 1,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id        TEXT,
  trial_ends_at          TIMESTAMPTZ,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ⚡ MODE DEV : simule n'importe quel forfait sans Stripe
CREATE TABLE dev_plan_overrides (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id        UUID NOT NULL REFERENCES plans(id),
  seats_override INT,       -- NULL = valeur du plan
  note           TEXT,      -- ex: "Test features Enterprise"
  is_active      BOOLEAN DEFAULT TRUE,
  set_by         UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)        -- 1 seul override actif par compagnie
);

-- Vue : résout le plan effectif (DEV override > abonnement réel > free par défaut)
CREATE VIEW effective_subscriptions AS
SELECT
  c.id                                             AS company_id,
  COALESCE(dpo.plan_id, s.plan_id,
    (SELECT id FROM plans WHERE slug = 'free'))    AS plan_id,
  COALESCE(dpo.seats_override, s.seats, 1)         AS seats,
  CASE WHEN dpo.id IS NOT NULL THEN TRUE
       ELSE FALSE END                              AS is_dev_override,
  dpo.note                                         AS dev_note,
  COALESCE(s.status, 'active'::sub_status)         AS status,
  s.stripe_subscription_id,
  s.current_period_end
FROM companies c
LEFT JOIN subscriptions s     ON s.company_id = c.id
LEFT JOIN dev_plan_overrides dpo ON dpo.company_id = c.id AND dpo.is_active = TRUE;

-- ============================================================
-- 05. CONFIGURATION & CONTEXTE
-- ============================================================

CREATE TABLE company_config (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  preferred_suppliers  JSONB DEFAULT '["rona","home_depot"]',
  project_types        JSONB DEFAULT '[]',
  quote_template       JSONB DEFAULT '{}',
  invoice_template     JSONB DEFAULT '{}',
  standard_clauses     TEXT,
  ai_auto_read_email   BOOLEAN DEFAULT TRUE,
  ai_auto_detect_leads BOOLEAN DEFAULT TRUE,
  ai_auto_followup     BOOLEAN DEFAULT FALSE,
  ai_followup_delay_days INT DEFAULT 5,
  ai_alerts_enabled    BOOLEAN DEFAULT TRUE,
  custom_fields        JSONB DEFAULT '{}',
  automations          JSONB DEFAULT '[]',
  landing_preference   TEXT DEFAULT 'dashboard',
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 06. ONBOARDING CHAT
-- ============================================================

CREATE TABLE onboarding_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES companies(id),
  profile_type  profile_type,
  messages      JSONB DEFAULT '[]',
  current_step  TEXT,
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 07. CONTACTS
-- ============================================================

CREATE TABLE contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type              contact_type NOT NULL DEFAULT 'prospect',
  name              TEXT NOT NULL,
  company_name      TEXT,
  email             TEXT,
  phone             TEXT,
  whatsapp          TEXT,
  address           TEXT,
  city              TEXT,
  province          TEXT DEFAULT 'QC',
  postal_code       TEXT,
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 08. SOUS-TRAITANTS
-- ============================================================

CREATE TABLE subcontractors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id    UUID REFERENCES contacts(id),
  name          TEXT NOT NULL,
  company_name  TEXT,
  email         TEXT,
  phone         TEXT,
  whatsapp      TEXT,
  rbq_number    TEXT,
  specialties   TEXT[] DEFAULT '{}',
  hourly_rate   NUMERIC(10,2),
  day_rate      NUMERIC(10,2),
  rating        NUMERIC(3,1),
  is_preferred  BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 09. LEADS
-- ============================================================

CREATE TABLE leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id    UUID REFERENCES contacts(id),
  assigned_to   UUID REFERENCES users(id),
  source        lead_source DEFAULT 'manual',
  source_url    TEXT,
  source_raw    JSONB,
  status        lead_status DEFAULT 'new',
  title         TEXT,
  description   TEXT,
  type_of_work  project_type,
  region        TEXT,
  city          TEXT,
  budget_min    NUMERIC(12,2),
  budget_max    NUMERIC(12,2),
  ai_score      INT,
  ai_notes      TEXT,
  priority      TEXT DEFAULT 'normal',
  follow_up_at  TIMESTAMPTZ,
  won_at        TIMESTAMPTZ,
  lost_at       TIMESTAMPTZ,
  lost_reason   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. PROJETS & PHASES
-- ============================================================

CREATE TABLE projects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id              UUID REFERENCES leads(id),
  client_id            UUID REFERENCES contacts(id),
  created_from_project UUID REFERENCES projects(id),
  name                 TEXT NOT NULL,
  description          TEXT,
  type                 project_type DEFAULT 'other',
  status               project_status DEFAULT 'active',
  address              TEXT,
  city                 TEXT,
  province             TEXT DEFAULT 'QC',
  postal_code          TEXT,
  start_date           DATE,
  end_date             DATE,
  actual_end_date      DATE,
  contract_value       NUMERIC(12,2),
  budget_materials     NUMERIC(12,2),
  budget_labor         NUMERIC(12,2),
  progress_pct         INT DEFAULT 0,
  notes                TEXT,
  custom_fields        JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id),
  subcontractor_id UUID REFERENCES subcontractors(id),
  role             TEXT NOT NULL,
  added_at         TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR subcontractor_id IS NOT NULL)
);

CREATE TABLE project_phases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  display_order INT NOT NULL DEFAULT 0,
  status        phase_status DEFAULT 'not_started',
  color         TEXT DEFAULT '#F26522',
  start_date    DATE,
  end_date      DATE,
  actual_start  DATE,
  actual_end    DATE,
  progress_pct  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id      UUID REFERENCES project_phases(id),
  name          TEXT NOT NULL,
  type          milestone_type DEFAULT 'billing',
  due_date      DATE NOT NULL,
  amount        NUMERIC(12,2),
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. DOCUMENTS & PLANS D'ARCHITECTE
-- ============================================================

CREATE TABLE project_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by      UUID REFERENCES users(id),
  type             doc_type DEFAULT 'other',
  name             TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_size        INT,
  mime_type        TEXT,
  extracted_data   JSONB,    -- {surfaces, dimensions, windows, doors, countertop_length,...}
  extraction_done  BOOLEAN DEFAULT FALSE,
  extraction_error TEXT,
  taken_at         TIMESTAMPTZ,
  gps_lat          NUMERIC(10,7),
  gps_lng          NUMERIC(10,7),
  phase_id         UUID REFERENCES project_phases(id),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. SOUMISSIONS / QUOTES
-- ============================================================

CREATE TABLE quotes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id          UUID REFERENCES projects(id),
  lead_id             UUID REFERENCES leads(id),
  document_id         UUID REFERENCES project_documents(id),
  created_from_quote  UUID REFERENCES quotes(id),
  version             INT DEFAULT 1,
  status              quote_status DEFAULT 'draft',
  title               TEXT,
  description         TEXT,
  subtotal_materials  NUMERIC(12,2) DEFAULT 0,
  subtotal_labor      NUMERIC(12,2) DEFAULT 0,
  subtotal            NUMERIC(12,2) DEFAULT 0,
  tps_pct             NUMERIC(5,2) DEFAULT 5,
  tvq_pct             NUMERIC(5,2) DEFAULT 9.975,
  tps_amount          NUMERIC(12,2) DEFAULT 0,
  tvq_amount          NUMERIC(12,2) DEFAULT 0,
  total               NUMERIC(12,2) DEFAULT 0,
  deposit_pct         NUMERIC(5,2) DEFAULT 30,
  deposit_amount      NUMERIC(12,2) DEFAULT 0,
  format              TEXT DEFAULT 'pdf',          -- 'pdf' | 'interactive'
  pdf_url             TEXT,
  interactive_url     TEXT,
  interactive_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  valid_until         DATE,
  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  viewed_count        INT DEFAULT 0,
  signed_at           TIMESTAMPTZ,
  signed_ip           TEXT,
  signature_data      TEXT,
  rejected_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  followup_config     JSONB DEFAULT '{}',
  last_followup_at    TIMESTAMPTZ,
  next_followup_at    TIMESTAMPTZ,
  notes               TEXT,
  custom_fields       JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quote_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id         UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'material',  -- 'material'|'labor'|'fee'|'discount'
  display_order    INT DEFAULT 0,
  name             TEXT NOT NULL,
  description      TEXT,
  qty              NUMERIC(10,3) DEFAULT 1,
  unit             TEXT DEFAULT 'un.',
  unit_price       NUMERIC(12,2) DEFAULT 0,
  total            NUMERIC(12,2) DEFAULT 0,
  supplier         TEXT,
  supplier_url     TEXT,
  supplier_price   NUMERIC(12,2),
  supplier_cached_at TIMESTAMPTZ,
  is_optional      BOOLEAN DEFAULT FALSE,
  is_selected      BOOLEAN DEFAULT TRUE,
  ai_suggested     BOOLEAN DEFAULT FALSE,
  assigned_to      UUID REFERENCES users(id),
  assigned_sub     UUID REFERENCES subcontractors(id),
  hours            NUMERIC(8,2),
  hourly_rate      NUMERIC(10,2),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. CONTRATS
-- ============================================================

CREATE TABLE contracts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id           UUID NOT NULL REFERENCES projects(id),
  quote_id             UUID REFERENCES quotes(id),
  status               contract_status DEFAULT 'draft',
  title                TEXT,
  terms                TEXT,
  pdf_url              TEXT,
  public_token         TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_name          TEXT,
  client_email         TEXT,
  signed_by_client     BOOLEAN DEFAULT FALSE,
  client_signed_at     TIMESTAMPTZ,
  client_signature     TEXT,
  client_ip            TEXT,
  contractor_signed_at TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. DEMANDES DE CHANGEMENT (DC)
-- ============================================================

CREATE TABLE change_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id),
  phase_id         UUID REFERENCES project_phases(id),
  number           INT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  reason           TEXT,
  status           co_status DEFAULT 'draft',
  amount           NUMERIC(12,2) DEFAULT 0,
  tps_amount       NUMERIC(12,2) DEFAULT 0,
  tvq_amount       NUMERIC(12,2) DEFAULT 0,
  total            NUMERIC(12,2) DEFAULT 0,
  impact_days      INT DEFAULT 0,
  public_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at          TIMESTAMPTZ,
  approved_at      TIMESTAMPTZ,
  approved_by      TEXT,
  approved_ip      TEXT,
  rejected_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  invoice_id       UUID,
  pdf_url          TEXT,
  notes            TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. FACTURATION & PAIEMENTS
-- ============================================================

CREATE TABLE invoices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id               UUID REFERENCES projects(id),
  milestone_id             UUID REFERENCES project_milestones(id),
  change_order_id          UUID REFERENCES change_orders(id),
  number                   TEXT NOT NULL,
  status                   invoice_status DEFAULT 'draft',
  client_name              TEXT NOT NULL,
  client_email             TEXT,
  client_address           TEXT,
  subtotal                 NUMERIC(12,2) DEFAULT 0,
  tps_pct                  NUMERIC(5,2) DEFAULT 5,
  tvq_pct                  NUMERIC(5,2) DEFAULT 9.975,
  tps_amount               NUMERIC(12,2) DEFAULT 0,
  tvq_amount               NUMERIC(12,2) DEFAULT 0,
  total                    NUMERIC(12,2) DEFAULT 0,
  amount_paid              NUMERIC(12,2) DEFAULT 0,
  amount_due               NUMERIC(12,2) DEFAULT 0,
  due_date                 DATE,
  paid_at                  TIMESTAMPTZ,
  payment_method           payment_method_t,
  stripe_payment_intent_id TEXT,
  stripe_payment_link_id   TEXT,
  stripe_payment_link_url  TEXT,
  paypal_order_id          TEXT,
  public_token             TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  pdf_url                  TEXT,
  sent_at                  TIMESTAMPTZ,
  viewed_at                TIMESTAMPTZ,
  next_reminder_at         TIMESTAMPTZ,
  reminder_count           INT DEFAULT 0,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty         NUMERIC(10,3) DEFAULT 1,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  total       NUMERIC(12,2) DEFAULT 0,
  order_idx   INT DEFAULT 0
);

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  method          payment_method_t NOT NULL,
  status          payment_status_t DEFAULT 'pending',
  stripe_charge_id TEXT,
  paypal_order_id TEXT,
  reference       TEXT,
  notes           TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quittances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID NOT NULL REFERENCES invoices(id),
  project_id     UUID NOT NULL REFERENCES projects(id),
  amount         NUMERIC(12,2) NOT NULL,
  signed_by      TEXT,
  signed_at      TIMESTAMPTZ,
  signature_data TEXT,
  pdf_url        TEXT,
  public_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. REQUEST FOR QUOTE — SOUS-TRAITANTS
-- ============================================================

CREATE TABLE rfqs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id),
  phase_id     UUID REFERENCES project_phases(id),
  title        TEXT NOT NULL,
  description  TEXT,
  specialty    TEXT,
  deadline     DATE,
  status       rfq_status DEFAULT 'open',
  awarded_to   UUID REFERENCES subcontractors(id),
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfq_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id           UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
  status           TEXT DEFAULT 'invited',
  amount           NUMERIC(12,2),
  notes            TEXT,
  availability_date DATE,
  sent_at          TIMESTAMPTZ,
  viewed_at        TIMESTAMPTZ,
  responded_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. QR CODE PUNCH / POINTAGE
-- ============================================================

CREATE TABLE site_qr_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  label        TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE timesheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id),
  site_qr_id       UUID REFERENCES site_qr_codes(id),
  user_id          UUID REFERENCES users(id),
  subcontractor_id UUID REFERENCES subcontractors(id),
  worker_name      TEXT,
  worker_phone     TEXT,
  clock_in         TIMESTAMPTZ,
  clock_out        TIMESTAMPTZ,
  hours_total      NUMERIC(6,2),
  method           punch_method DEFAULT 'qr',
  gps_lat_in       NUMERIC(10,7),
  gps_lng_in       NUMERIC(10,7),
  gps_lat_out      NUMERIC(10,7),
  gps_lng_out      NUMERIC(10,7),
  notes            TEXT,
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR subcontractor_id IS NOT NULL OR worker_name IS NOT NULL)
);

-- ============================================================
-- 18. INTÉGRATIONS (WhatsApp propre au client, Gmail, etc.)
-- ============================================================

CREATE TABLE integrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type                  integration_type NOT NULL,
  status                integration_status DEFAULT 'disconnected',
  credentials           JSONB DEFAULT '{}',   -- chiffré en production
  metadata              JSONB DEFAULT '{}',
  -- WhatsApp (compte du client, connecté via Meta Embedded Signup)
  whatsapp_phone_number TEXT,
  whatsapp_account_id   TEXT,
  whatsapp_phone_id     TEXT,
  -- Gmail
  gmail_address         TEXT,
  -- Stripe Connect (pour encaisser leurs propres clients)
  stripe_account_id     TEXT,
  last_sync_at          TIMESTAMPTZ,
  connected_at          TIMESTAMPTZ,
  disconnected_at       TIMESTAMPTZ,
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, type)
);

-- ============================================================
-- 19. MESSAGES (WhatsApp / email entrants & sortants)
-- ============================================================

CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id),
  contact_id     UUID REFERENCES contacts(id),
  project_id     UUID REFERENCES projects(id),
  lead_id        UUID REFERENCES leads(id),
  direction      TEXT NOT NULL,       -- 'inbound' | 'outbound'
  channel        TEXT NOT NULL,       -- 'whatsapp' | 'email' | 'sms'
  from_address   TEXT,
  to_address     TEXT,
  subject        TEXT,
  body           TEXT,
  attachments    JSONB DEFAULT '[]',
  external_id    TEXT,
  is_read        BOOLEAN DEFAULT FALSE,
  ai_processed   BOOLEAN DEFAULT FALSE,
  ai_summary     TEXT,
  ai_action_taken TEXT,
  sent_at        TIMESTAMPTZ,
  received_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. IA — CHAT & ACTIONS EN ATTENTE
-- ============================================================

CREATE TABLE ai_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  context_type  TEXT DEFAULT 'general',  -- 'onboarding'|'general'|'estimation'|'navigation'
  project_id    UUID REFERENCES projects(id),
  messages      JSONB DEFAULT '[]',      -- [{role, content, timestamp, attachments}]
  title         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id),
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  source       action_source DEFAULT 'system',
  source_ref_id UUID,
  status       action_status DEFAULT 'pending',
  payload      JSONB DEFAULT '{}',
  executed_at  TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 21. LEADS EXTERNES (scraping / agents IA)
-- ============================================================

CREATE TABLE external_lead_imports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source       lead_source NOT NULL,
  source_url   TEXT,
  raw_html     TEXT,
  parsed_data  JSONB DEFAULT '{}',
  lead_id      UUID REFERENCES leads(id),
  ai_score     INT,
  ai_notes     TEXT,
  was_imported BOOLEAN DEFAULT FALSE,
  was_rejected BOOLEAN DEFAULT FALSE,
  scraped_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 22. CACHE PRIX FOURNISSEURS
-- ============================================================

CREATE TABLE material_price_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier        TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  product_url     TEXT,
  product_sku     TEXT,
  price           NUMERIC(12,2),
  unit            TEXT,
  in_stock        BOOLEAN,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier, product_sku)
);

-- ============================================================
-- 23. FACTURATION MONFLUX (abonnements SaaS)
-- ============================================================

CREATE TABLE monflux_billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  event_type      TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  amount          NUMERIC(12,2),
  currency        TEXT DEFAULT 'cad',
  payload         JSONB DEFAULT '{}',
  processed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 24. AUDIT / ACTIVITÉ
-- ============================================================

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  action      TEXT NOT NULL,
  changes     JSONB DEFAULT '{}',
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_google_id        ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_cm_company             ON company_members(company_id);
CREATE INDEX idx_cm_user                ON company_members(user_id);
CREATE INDEX idx_sub_company            ON subscriptions(company_id);
CREATE INDEX idx_dev_override_company   ON dev_plan_overrides(company_id) WHERE is_active = TRUE;
CREATE INDEX idx_leads_company          ON leads(company_id);
CREATE INDEX idx_leads_status           ON leads(status);
CREATE INDEX idx_projects_company       ON projects(company_id);
CREATE INDEX idx_projects_status        ON projects(status);
CREATE INDEX idx_phases_project         ON project_phases(project_id);
CREATE INDEX idx_milestones_project     ON project_milestones(project_id);
CREATE INDEX idx_quotes_company         ON quotes(company_id);
CREATE INDEX idx_quotes_project         ON quotes(project_id);
CREATE INDEX idx_quotes_token           ON quotes(interactive_token);
CREATE INDEX idx_invoices_company       ON invoices(company_id);
CREATE INDEX idx_invoices_status        ON invoices(status);
CREATE INDEX idx_invoices_token         ON invoices(public_token);
CREATE INDEX idx_timesheets_project     ON timesheets(project_id);
CREATE INDEX idx_timesheets_clockin     ON timesheets(clock_in);
CREATE INDEX idx_messages_company       ON messages(company_id);
CREATE INDEX idx_ai_actions_pending     ON ai_actions(company_id, status) WHERE status = 'pending';
CREATE INDEX idx_activity_company       ON activity_log(company_id);
CREATE INDEX idx_contacts_name_trgm     ON contacts USING GIN(name gin_trgm_ops);
CREATE INDEX idx_projects_name_trgm     ON projects USING GIN(name gin_trgm_ops);
CREATE INDEX idx_leads_title_trgm       ON leads    USING GIN(title gin_trgm_ops);
