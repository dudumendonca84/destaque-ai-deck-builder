-- =====================================================
-- destaque.ai Deck Builder · migration 001 — schema base
-- =====================================================

create extension if not exists "uuid-ossp";

-- ---------------- prospects ----------------
create table prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  company_name text not null,
  company_website text,
  contact_name text,
  contact_email text,
  contact_role text,
  linkedin_url text,
  business_type text,
  location text,
  target_audience text,
  competitors text[],
  notes text,
  source text,
  status text default 'lead'
    check (status in ('lead','contacted','opened','replied','scheduled','won','lost'))
);

create index idx_prospects_status on prospects(status);
create index idx_prospects_created on prospects(created_at desc);

-- ---------------- proposals ----------------
create table proposals (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  token text unique not null,
  custom_prompts text[] not null,
  custom_message text,
  pricing_diagnostico integer,
  pricing_sprint integer,
  pricing_retainer integer,
  audit_status text default 'pending'
    check (audit_status in ('pending','running','completed','failed')),
  audit_started_at timestamptz,
  audit_completed_at timestamptz,
  audit_results jsonb,
  status text default 'draft'
    check (status in ('draft','sent','viewed','replied','expired')),
  sent_at timestamptz,
  expires_at timestamptz,
  first_viewed_at timestamptz,
  deleted_at timestamptz
);

create index idx_proposals_token on proposals(token);
create index idx_proposals_prospect on proposals(prospect_id);
create index idx_proposals_status on proposals(status);

-- ---------------- proposal_events ----------------
create table proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade,
  created_at timestamptz default now(),
  event_type text not null,
  slide_number integer,
  slide_id text,
  duration_seconds integer,
  user_agent text,
  ip_country text,
  referrer text,
  session_id text
);

create index idx_events_proposal on proposal_events(proposal_id, created_at desc);

-- ---------------- audit_runs ----------------
create table audit_runs (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade,
  created_at timestamptz default now(),
  prompt text not null,
  engine text not null check (engine in ('chatgpt','claude','gemini','perplexity')),
  response text,
  citations_found text[],
  brand_position integer,
  brand_present boolean default false,
  competitors_mentioned text[],
  sentiment_score numeric,
  tokens_used integer,
  cost_usd numeric(10,6)
);

create index idx_runs_proposal on audit_runs(proposal_id);

-- ---------------- triggers ----------------
create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_prospects
  before update on prospects
  for each row execute function trigger_set_updated_at();

create trigger set_updated_at_proposals
  before update on proposals
  for each row execute function trigger_set_updated_at();
