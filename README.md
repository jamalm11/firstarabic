# 🕌 FirstArabic

Plateforme web simple et sécurisée pour connecter des **élèves** avec des **professeurs** d'arabe, avec prise de rendez-vous, gestion des cours, et authentification via **Supabase**.

---

## 🚀 Fonctionnalités

- Authentification sécurisée via Supabase
- Création et gestion des profils **prof** et **élève**
- Réservation de **cours** (CRUD complet)
- API REST construite avec **Node.js + Express**
- Conteneurisation avec **Docker**

---

## ⚙️ Stack Technique

| Composant     | Technologie         |
|---------------|---------------------|
| Backend API   | Node.js, Express     |
| Auth & DB     | Supabase (PostgreSQL + Auth) |
| Déploiement   | Docker, Docker Compose |
| Tests         | `curl` (fichiers de test `test_*.sh`) |

---

## 📁 Structure des dossiers

```
firstarabic/
├── backend/
│   ├── index.js          # API principale
│   ├── test_prof.sh      # Script curl pour tester les routes prof
│   ├── test_eleve.sh     # Script curl pour tester les routes élève
│   ├── test_cours.sh     # Script curl pour tester les cours
│   └── ...               # Autres fichiers éventuels
├── docker-compose.yml    # Conteneurisation
├── .env                  # Variables d’environnement (non versionné)
└── README.md             # Ce fichier
```

---

## 🐳 Lancement avec Docker

### 1. 🧪 Préparer `.env`

Crée un fichier `.env` à la racine de `backend/` :

```
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
```

### 2. 🧱 Lancer les services

```bash
docker compose up --build
```

- API disponible sur `http://localhost:3001`
- pgAdmin accessible sur `http://localhost:5050`

---

## 📬 Endpoints disponibles

### 🔐 Authentification requise pour tous sauf `/profs`

#### 👤 Professeurs

| Méthode | Endpoint      | Description                          |
|---------|---------------|--------------------------------------|
| POST    | /prof         | Créer ou mettre à jour son profil    |
| GET     | /prof/me      | Récupérer son propre profil          |
| GET     | /profs        | Liste publique des profs validés     |

#### 🧒 Élèves

| Méthode | Endpoint      | Description                          |
|---------|---------------|--------------------------------------|
| POST    | /eleve        | Créer un élève                       |
| GET     | /eleves       | Liste de mes élèves                  |
| GET     | /eleve/:id    | Détail d’un élève                    |
| PUT     | /eleve/:id    | Mise à jour d’un élève               |
| DELETE  | /eleve/:id    | Supprimer un élève                   |

#### 📅 Cours

| Méthode | Endpoint      | Description                          |
|---------|---------------|--------------------------------------|
| POST    | /cours        | Réserver un cours                    |
| GET     | /cours        | Voir tous les cours                  |
| GET     | /cours/:id    | Voir un cours en particulier         |
| PUT     | /cours/:id    | Modifier le statut du cours          |
| DELETE  | /cours/:id    | Supprimer un cours                   |

---

## 🧪 Tester l’API

Utilise les scripts :

```bash
cd backend
./test_prof.sh
./test_eleve.sh
./test_cours.sh
```

⚠️ Assure-toi de mettre à jour les `UUID` dans `test_cours.sh` (prof + élève) avant exécution.

---

## ☁️ Déploiement (GitHub + Docker Hub)

### 🔁 GitHub

- Repo public : [https://github.com/jamalm11/firstarabic](https://github.com/jamalm11/firstarabic)

### 🐋 Docker Hub *(à configurer si pas encore fait)*

- Tu peux publier ton image avec :
```bash
docker build -t jamalm11/firstarabic-api .
docker push jamalm11/firstarabic-api
```

---

## 👨‍💻 Auteur

Développé par **jamalm11**  
Projet personnel pour faciliter l’enseignement de l’arabe à distance.

---
