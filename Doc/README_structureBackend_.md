📦 Backend FirstArabic — Structure et Fonctionnement

🧩 Objectif

Ce backend gère la plateforme de mise en relation entre élèves et professeurs, avec :
	•	Authentification via Supabase
	•	Création et gestion de comptes (élèves/profs)
	•	Réservations de cours et disponibilités
	•	Notifications
	•	Paiement via Stripe

⸻

📁 Structure des dossiers
backend/
├── index.js                   # Point d’entrée principal de l’API Express
├── supabaseClient.js         # Client Supabase (clé publique)
├── supabaseAdminClient.js    # Client Supabase (clé service role)
├── middleware/
│   └── ensureProfile.js      # Middleware Supabase pour créer un profil si inexistant
├── routes/
│   ├── elevesRoutes.js
│   ├── profRoutes.js
│   ├── coursRoutes.js
│   ├── disponibilitesRoutes.js
│   ├── reservationsRoutes.js
│   └── notificationsRoutes.js
├── controllers/
│   ├── abonnementController.js
│   ├── paiementController.js
│   ├── reservationsController.js
│   ├── disponibilitesController.js
│   └── notificationsController.js
├── validators/
│   ├── eleveValidator.js
│   ├── profValidator.js
│   ├── coursValidator.js
│   ├── reservationValidator.js
│   └── notificationValidator.js
└── utils/
    └── email.js              # Fonction d’envoi d’email avec Nodemailer

⸻

🔐 Authentification
	•	Utilise Supabase Auth (via email/password).
	•	Un middleware authenticateToken vérifie le token JWT et ajoute req.user.
	•	Le client Supabase avec Authorization: Bearer ... est injecté dans req.supabase.

⸻

🚀 Routes principales
Domaine
Chemin
Fichier
Auth/email
/check-email
index.js
Éléves
/eleves/...
routes/elevesRoutes.js
Professeurs
/profs/...
routes/profRoutes.js
Cours
/cours/...
routes/coursRoutes.js
Disponibilités
/disponibilites/...
routes/disponibilitesRoutes.js
Réservations
/reservations/...
routes/reservationsRoutes.js
Notifications
/notifications/...
routes/notificationsRoutes.js
Abonnements
/abonnements/...
controllers/abonnementController.js
Paiement Stripe
/stripe/webhook
controllers/paiementController.js


⸻

✅ Validation
	•	Toutes les données sensibles sont validées avec Joi (validators/).
	•	Chaque route utilise un schéma de validation adapté (nom, date, email, etc.).

⸻

🛠️ Bonnes pratiques appliquées
	•	✅ Séparation claire des responsabilités (routes vs controllers vs validators)
	•	✅ Authentification sécurisée avec token + Supabase Admin pour insertion protégée
	•	✅ Debug logging (console.log) intégré à toutes les routes sensibles
	•	✅ Protection contre spam avec express-rate-limit
