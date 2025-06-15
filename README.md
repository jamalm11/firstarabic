# 📘 API FirstArabic — Backend Node.js + Supabase

Ce backend expose une API REST sécurisée permettant la gestion des professeurs, élèves, cours, disponibilités et notifications — inspiré des fonctionnalités clés de Cambly.

---

## ✅ Technologies

- 🟨 Node.js + Express
- 🟦 Supabase (PostgreSQL + Auth + RLS)
- 📦 Joi (validation)
- 🔐 Authentification par JWT Supabase
- 🧪 Scripts de test bash (`curl`)

---

## 📂 Structure des dossiers

```
backend/
├── controllers/         # Logique métier (CRUD)
├── validators/          # Schémas Joi
├── index.js             # Point d’entrée Express
├── supabaseClient.js    # (optionnel) Client centralisé
test_*.sh                # Scripts de test manuels
```

---

## 🔐 Authentification

Toutes les routes protégées utilisent un `Bearer Token` généré par Supabase.  
Exemple d'en-tête :

```
Authorization: Bearer <jwt_token>
```

---

## 📊 Tables Supabase

| Table           | Colonnes clés                            | RLS / Policies                                                  |
|----------------|-------------------------------------------|-----------------------------------------------------------------|
| `eleves`        | `id`, `nom`, `created_by`, `created_at`   | SELECT, INSERT, UPDATE, DELETE selon `auth.uid() == created_by` |
| `profs`         | `id`, `nom`, `bio`, `created_by`, `is_validated` | INSERT/UPDATE en propriété | SELECT si `is_validated = true`   |
| `disponibilites`| `jour`, `heure_debut`, `heure_fin`, `created_by` | CRUD autorisé si `created_by == auth.uid()`                   |
| `cours`         | `date`, `prof_id`, `eleve_id`, `statut`, `created_by` | Élève peut CRUD, prof peut SELECT                             |
| `notifications` | `titre`, `contenu`, `is_lu`, `user_id`    | CRUD uniquement sur `user_id = auth.uid()`                    |

---

## 🧪 Scripts de test Bash

Chaque entité a son script :

```bash
./test_eleve.sh
./test_prof.sh
./test_disponibilites_create.sh
./test_disponibilites_update.sh
./test_disponibilites_get_by_id.sh
./test_disponibilites_delete.sh
./test_cours.sh
./test_notifications.sh
```

Chaque script utilise `curl` avec le token Supabase de test.

---

## 🔄 Endpoints API disponibles

### 👤 Élèves
| Méthode | Route           | Description               |
|--------|------------------|---------------------------|
| POST   | `/eleve`         | Créer un élève            |
| GET    | `/eleves`        | Lister mes élèves         |
| GET    | `/eleve/:id`     | Détail d’un élève         |
| PUT    | `/eleve/:id`     | Modifier un élève         |
| DELETE | `/eleve/:id`     | Supprimer un élève        |

### 👨‍🏫 Professeurs
| Méthode | Route       | Description                           |
|--------|--------------|----------------------------------------|
| POST   | `/prof`      | Créer ou mettre à jour son profil     |
| GET    | `/prof/me`   | Voir son propre profil                |
| GET    | `/profs`     | Lister les profs validés              |

### 🗓️ Disponibilités
| Méthode | Route                   | Description                         |
|--------|--------------------------|-------------------------------------|
| POST   | `/disponibilites`        | Créer une disponibilité             |
| GET    | `/disponibilites`        | Lister mes disponibilités           |
| GET    | `/disponibilites/:id`    | Voir une disponibilité              |
| PUT    | `/disponibilites/:id`    | Modifier une disponibilité          |
| PATCH  | `/disponibilites/:id`    | Modifier partiellement              |
| DELETE | `/disponibilites/:id`    | Supprimer une disponibilité         |

### 📚 Cours
| Méthode | Route         | Description                        |
|--------|----------------|------------------------------------|
| POST   | `/cours`       | Créer un cours                     |
| GET    | `/cours`       | Lister les cours (vue enrichie)    |
| GET    | `/cours/:id`   | Détail d’un cours                  |
| PUT    | `/cours/:id`   | Mettre à jour le statut            |
| DELETE | `/cours/:id`   | Supprimer un cours                 |

### 🔔 Notifications
| Méthode | Route               | Description                        |
|--------|----------------------|------------------------------------|
| POST   | `/notifications`     | Créer une notification             |
| GET    | `/notifications`     | Lister mes notifications           |
| PUT    | `/notifications/:id` | Marquer comme lue                  |
| DELETE | `/notifications/:id` | Supprimer la notification          |

---

## 🔑 Exemple de .env

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key
```

---

## ✅ Checklist finale

- [x] Authentification par JWT
- [x] Contrôle RLS pour chaque table
- [x] Validators Joi par module
- [x] Contrôleurs Express bien structurés
- [x] Tests manuels par script bash
- [x] README finalisé 🎉

---

> © Projet pédagogique inspiré de Cambly – API simplifiée pour gestion de cours à distance.
