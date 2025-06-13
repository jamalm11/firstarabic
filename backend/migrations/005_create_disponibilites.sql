-- Création de la table disponibilites
create table if not exists disponibilites (
  id serial primary key,
  prof_id uuid not null references profs(id) on delete cascade,
  jour text not null check (jour in ('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche')),
  heure_debut time not null,
  heure_fin time not null,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default current_timestamp
);

-- Activer Row-Level Security
alter table disponibilites enable row level security;

-- Politique : un prof peut voir ses disponibilités
create policy "Voir ses disponibilites"
on disponibilites
for select
to public
using (auth.uid() = created_by);

-- Politique : un prof peut ajouter ses disponibilites
create policy "Ajouter disponibilites"
on disponibilites
for insert
to public
with check (auth.uid() = created_by);

-- Politique : un prof peut modifier ses disponibilites
create policy "Modifier disponibilites"
on disponibilites
for update
to public
using (auth.uid() = created_by);

-- Politique : un prof peut supprimer ses disponibilites
create policy "Supprimer disponibilites"
on disponibilites
for delete
to public
using (auth.uid() = created_by);
