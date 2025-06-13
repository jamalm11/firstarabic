-- Création de la table notifications
create table if not exists public.notifications (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  type text default 'info',
  lue boolean default false,
  created_at timestamptz default timezone('utc'::text, now())
);

-- Activer RLS
alter table public.notifications enable row level security;

-- Politique : l'utilisateur peut insérer une notification pour lui-même
create policy "Insert notifications pour soi-même"
on public.notifications
for insert
to public
with check (auth.uid() = user_id);

-- Politique : l'utilisateur peut lire ses propres notifications
create policy "Voir ses notifications"
on public.notifications
for select
to public
using (auth.uid() = user_id);

-- Politique : l'utilisateur peut modifier ses notifications (ex: lues)
create policy "Marquer comme lue ses notifications"
on public.notifications
for update
to public
using (auth.uid() = user_id);

-- Politique : l'utilisateur peut supprimer ses notifications
create policy "Supprimer ses notifications"
on public.notifications
for delete
to public
using (auth.uid() = user_id);
