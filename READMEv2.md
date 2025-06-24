# 🕌 FirstArabic — Plateforme d'enseignement de l'arabe

Plateforme web permettant aux élèves de réserver des cours d'arabe avec des professeurs via un système simple, sécurisé et automatisé.

---

## 📁 Structure du projet

```
firstarabic/
│
├── backend/                  # API Express + Supabase
│   ├── controllers/          # Logique des routes
│   ├── middleware/           # Middleware d'auth (optionnel)
│   ├── routes/               # Routes (optionnel, parfois intégré dans index.js)
│   ├── utils/                # Fonctions utilitaires (emails, etc.)
│   ├── validators/           # Schémas Joi (cours, prof, élève)
│   ├── .env                  # Variables Supabase, Stripe (non versionné)
│   ├── index.js              # Point d'entrée de l'API
│   ├── package.json          # Dépendances backend
│   └── Dockerfile            # Image Docker backend
│
├── frontend-firstarabic/     # Frontend React (Next.js ou Vite ou CRA)
│   ├── src/                  # Composants et pages
│   ├── public/               # Assets statiques
│   ├── .env                  # Variables Supabase côté front (non versionné)
│   └── package.json          # Dépendances frontend
│
├── docker-compose.yml        # Stack complète (API + DB + pgAdmin)
├── .gitignore                # Fichiers exclus de Git
└── README.md                 # Ce fichier 📄
```

---

## 🚀 Lancement local (avec Docker)

Assurez-vous d'avoir Docker installé. Ensuite :

```bash
docker-compose up --build
```

Cela lancera :
- `firstarabic-api` : l'API Node.js (port 3001)
- `firstarabic-db` : base PostgreSQL (port 5432)
- `pgAdmin` : interface base de données (http://localhost:5050)

---

## 🔧 Variables d'environnement `.env`

**backend/.env** (exemple) :

```
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_KEY=service_role_or_anon_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**frontend-firstarabic/.env** (exemple) :

```
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=pk_test_...
```

---

## 🧪 Commandes utiles

```bash
# Lancer uniquement l’API (mode dev local)
cd backend && npm install && npm start

# Lancer le frontend (mode dev local)
cd frontend-firstarabic && npm install && npm run dev

# Rebuild l'image Docker (si changement package.json)
docker-compose build

# Arrêter et nettoyer les containers
docker-compose down
```

---

## ✅ Fonctionnalités disponibles

- Authentification Supabase (JWT)
- Création/édition de :
  - Professeurs
  - Élèves
  - Cours (avec lien Jitsi)
  - Réservations et disponibilités
  - Notifications
- Paiement via Stripe
- Dashboard prof/élève
- Planification de créneaux intelligents

---

## 🛡️ Sécurité

- RLS (Row Level Security) activé dans Supabase
- Authentification par token dans l'API
- Variables secrètes non versionnées (`.env`)

---

## ✨ Auteur

Développé par [ton nom / pseudo] – 2025.
