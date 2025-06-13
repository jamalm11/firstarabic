-- 002_create_eleves.sql
create table if not exists eleves (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default current_timestamp
);

-- Row-Level Security
alter table eleves enable row level security;

-- Policies
create policy "Un utilisateur peut voir ses eleves" on eleves
  for select using (auth.uid() = created_by);

create policy "Un utilisateur peut ajouter un eleve" on eleves
  for insert with check (auth.uid() = created_by);

create policy "Un utilisateur peut modifier son eleve" on eleves
  for update using (auth.uid() = created_by);

create policy "Un utilisateur peut supprimer son eleve" on eleves
  for delete using (auth.uid() = created_by);
