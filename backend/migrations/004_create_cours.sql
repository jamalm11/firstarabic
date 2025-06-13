-- 004_create_cours.sql
create table if not exists cours (
  id serial primary key,
  date timestamp with time zone not null,
  statut text default 'confirme',
  prof_id uuid references profs(id) on delete cascade,
  eleve_id uuid references eleves(id) on delete cascade,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default current_timestamp
);

-- Row-Level Security
alter table cours enable row level security;

-- Policies
create policy "Un utilisateur peut voir ses cours" on cours
  for select using (auth.uid() = created_by);

create policy "Un utilisateur peut ajouter un cours" on cours
  for insert with check (auth.uid() = created_by);

create policy "Un utilisateur peut modifier un cours" on cours
  for update using (auth.uid() = created_by);

create policy "Un utilisateur peut supprimer un cours" on cours
  for delete using (auth.uid() = created_by);

