-- Outreach AI schema — run once in Supabase SQL Editor

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company text,
  title text,
  website text,
  linkedin_url text,
  email text,
  phone text,
  location text,
  city text,
  region text,
  category text,        -- e.g. "salon", "restaurant", "boutique" — from Local Business Finder
  industry text,
  stage text not null default 'new' check (stage in ('new','contacted','replied','meeting_scheduled','client','lost')),
  tag text check (tag in ('hot','warm','cold','follow_up','client')),
  channel text check (channel in ('linkedin','instagram','whatsapp','email','other')),
  source text default 'manual', -- manual | csv_import | hunter | google_places
  last_interaction_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_touches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('linkedin','instagram','whatsapp','email','other')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  subject text,
  body text not null,
  sequence_step int not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','opened','replied','bounced')),
  provider_message_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  google_event_id text,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
alter table public.lead_touches enable row level security;
alter table public.email_messages enable row level security;
alter table public.meetings enable row level security;

create policy "owner can manage own leads" on public.leads
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner can manage own touches" on public.lead_touches
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner can manage own emails" on public.email_messages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner can manage own meetings" on public.meetings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists leads_owner_idx on public.leads(owner_id);
create index if not exists touches_lead_idx on public.lead_touches(lead_id);
create index if not exists emails_owner_idx on public.email_messages(owner_id);
create index if not exists emails_lead_idx on public.email_messages(lead_id);
create index if not exists meetings_owner_idx on public.meetings(owner_id);
