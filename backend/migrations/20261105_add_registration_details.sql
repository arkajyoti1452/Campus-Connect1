alter table public.registrations
  add column if not exists ticket_tier text not null default 'standard',
  add column if not exists attendee jsonb not null default '{}'::jsonb;
