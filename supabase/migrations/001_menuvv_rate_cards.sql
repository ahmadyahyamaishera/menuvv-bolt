create table if not exists public.menuvv_rate_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled rate card',
  slug text,
  url text,
  payload jsonb not null default '[]'::jsonb,
  phone text,
  country jsonb not null default '{}'::jsonb,
  currency jsonb not null default '{}'::jsonb,
  include_business_name boolean not null default true,
  include_currency boolean not null default true,
  business_image text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists menuvv_rate_cards_user_updated_idx
  on public.menuvv_rate_cards (user_id, updated_at desc);

alter table public.menuvv_rate_cards enable row level security;

drop policy if exists "Users can view their own Menuvv cards" on public.menuvv_rate_cards;
create policy "Users can view their own Menuvv cards"
  on public.menuvv_rate_cards
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own Menuvv cards" on public.menuvv_rate_cards;
create policy "Users can create their own Menuvv cards"
  on public.menuvv_rate_cards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Menuvv cards" on public.menuvv_rate_cards;
create policy "Users can update their own Menuvv cards"
  on public.menuvv_rate_cards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own Menuvv cards" on public.menuvv_rate_cards;
create policy "Users can delete their own Menuvv cards"
  on public.menuvv_rate_cards
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.menuvv_set_rate_card_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists menuvv_rate_cards_updated_at on public.menuvv_rate_cards;
create trigger menuvv_rate_cards_updated_at
before update on public.menuvv_rate_cards
for each row execute function public.menuvv_set_rate_card_updated_at();