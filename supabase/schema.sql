-- Execute no Supabase: SQL Editor → New query → Run.
-- Depois: Authentication → Providers → Google (ativar) e em URL Configuration adicionar:
--   https://petryjunior.github.io/album-copa-2026/
--   http://localhost:5173/   (vite dev)

create table if not exists public.album_sync (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{"version":3,"quantities":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists album_sync_updated_at_idx on public.album_sync (updated_at desc);

alter table public.album_sync enable row level security;

drop policy if exists "album_sync_select_own" on public.album_sync;
create policy "album_sync_select_own"
  on public.album_sync for select
  using (auth.uid() = user_id);

drop policy if exists "album_sync_insert_own" on public.album_sync;
create policy "album_sync_insert_own"
  on public.album_sync for insert
  with check (auth.uid() = user_id);

drop policy if exists "album_sync_update_own" on public.album_sync;
create policy "album_sync_update_own"
  on public.album_sync for update
  using (auth.uid() = user_id);

create or replace function public.album_sync_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists album_sync_set_updated_at on public.album_sync;
create trigger album_sync_set_updated_at
  before update on public.album_sync
  for each row
  execute function public.album_sync_touch_updated_at();
