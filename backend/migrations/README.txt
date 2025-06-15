# Migrations SQL - Supabase

Ce dossier contient les fichiers SQL à exécuter sur Supabase pour créer ou modifier la structure des tables.

## Fichiers disponibles :

- `001_create_notifications.sql`  
  ➤ Crée la table `notifications` avec les colonnes :
    - `id` (PK)
    - `user_id` (UUID)
    - `message` (texte)
    - `type` (alerte/info/etc.)
    - `is_read` (booléen)
    - `lue` (booléen redondant pour test)
    - `created_at` (timestamp)

  ➤ Active Row-Level Security (RLS)

  ➤ Crée la politique :
    - Un utilisateur peut insérer/lire/mettre à jour/supprimer uniquement **ses propres notifications**

---

## Instructions :

Pour appliquer une migration :

1. Se connecter à l’interface SQL de Supabase
2. Coller le contenu du fichier `.sql`
3. Exécuter

---

_Nom de commit lié :_
> 🧱 Création de la table notifications avec RLS et champs complets
