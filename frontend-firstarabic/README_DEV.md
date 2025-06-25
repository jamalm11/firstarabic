# ✅ FirstArabic – Guide Développeur (Authentification & Réinitialisation)

## 📁 Structure des fichiers modifiés

```
src/
├── App.js                         # Définition des routes principales
├── config.js                     # Centralisation des variables et endpoints
├── supabaseClient.js            # Initialisation Supabase avec redirectTo
├── components/
│   └── Login.js                 # Page de connexion
├── pages/
│   ├── Register.js             # Création de compte (prof/élève)
│   ├── ForgotPassword.js       # Demande de lien de réinitialisation
│   ├── ResetPassword.js        # Saisie du nouveau mot de passe
│   ├── Dashboard.js            # Espace élève
│   └── ProfDashboard.js        # Espace prof
```

---

## 🔐 Authentification Supabase

- Utilise `auth.signInWithPassword()` pour la connexion
- `role` est lu depuis `user_metadata.role`
- Redirection vers `/dashboard` ou `/prof-dashboard`

---

## 🔁 Réinitialisation du mot de passe

1. `ForgotPassword.js`
   - Utilise `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
   - Redirection dynamique via :  
     ```js
     redirectTo: `${window.location.origin}${AUTH_REDIRECT_PATH}`
     ```

2. `ResetPassword.js`
   - Valide le token de session avec `getSession()`
   - Change le mot de passe avec `auth.updateUser({ password })`
   - Nettoie l’URL :
     ```js
     window.history.replaceState({}, document.title, "/reset-password");
     ```

---

## 🌍 Fichier `.env` requis

Créer un fichier `.env` à la racine avec les variables suivantes :

```env
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxx
REACT_APP_API_URL=http://localhost:3001
```

---

## ⚙️ Fichier `src/config.js`

```js
export const AUTH_REDIRECT_PATH = "/reset-password";
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
export const API_ENDPOINTS = {
  PROFESSEURS: "/profs",
  ELEVES: "/eleves",
  COURS: "/cours",
  CHECK_EMAIL: "/check-email",
};
```

---

## ✅ Bonnes pratiques implémentées

- 🔒 Vérification des variables d’environnement (fail-safe)
- 📦 Factorisation des URLs/API dans `config.js`
- 🕐 Chargement / désactivation du bouton lors du `register`
- ⚠️ Affichage d'erreurs d'API
- 🧼 Nettoyage automatique de l'URL après reset
- 🧪 Redirections fonctionnelles testées (`/forgot-password → reset-password → login`)

---

## 🚀 Commandes Git recommandées

```bash
git checkout -b refactor-auth
# ... Modifications ...
git add .
git commit -m "✅ Refactor auth complet (reset password, redirect, config centralisée)"
git push origin refactor-auth
# Optionnel : merge dans main après validation
```

---

## 🔁 À faire plus tard (améliorations futures)

- ✅ Ajout d’un composant `ProtectedRoute` pour sécuriser les dashboards
- 🔐 Vérification de validité des tokens d’accès
- 📱 Responsive mobile complet
- ♻️ Hook `useAuth()` centralisé

---

📬 En cas de question, ping `@jamalm11` ou l’équipe technique.
