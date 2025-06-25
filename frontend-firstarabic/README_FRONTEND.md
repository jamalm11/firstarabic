# FirstArabic - Plateforme éducative en ligne

## 🎯 Objectif
Permettre aux élèves d'apprendre l’arabe avec des professeurs qualifiés via une interface simple de réservation et d’échange.

## ✅ Fonctionnalités implémentées

- [x] Système d'inscription avec rôle (élève ou professeur)
- [x] Validation par email
- [x] Enregistrement automatique dans la base (`eleves` ou `profs`)
- [x] Politique RLS sécurisée (insert uniquement si `created_by = auth.uid()`)
- [x] Interface Dashboard dynamique :
  - Élève : choisir un professeur, sélectionner une date, réserver un cours
  - Professeur : interface dédiée (bientôt enrichie)

## 🧠 Technologies

- Frontend : React.js
- Backend : Node.js + Supabase
- Authentification : Supabase Auth
- Base de données : PostgreSQL (via Supabase)
- Vidéo : Jitsi (cours en ligne)

## 🚀 Démarrage local

```bash
# Lancer le backend
cd backend
docker-compose up -d

# Lancer le frontend
cd frontend-firstarabic
npm install
npm start
