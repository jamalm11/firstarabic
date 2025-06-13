
-- 003_create_profs.sql
create table if not exists profs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  specialite text,
  bio text,
  is_validated boolean default false,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default current_timestamp
);

-- Row-Level Security
alter table profs enable row level security;

-- Policies
create policy "Un utilisateur peut voir son prof" on profs
  for select using (auth.uid() = created_by);

create policy "Un utilisateur peut ajouter un prof" on profs
  for insert with check (auth.uid() = created_by);

create policy "Un utilisateur peut modifier son prof" on profs
  for update using (auth.uid() = created_by);

create policy "Un utilisateur peut supprimer son prof" on profs
  for delete using (auth.uid() = created_by);

