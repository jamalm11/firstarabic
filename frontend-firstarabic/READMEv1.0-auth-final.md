# FirstArabic - Plateforme d'apprentissage des langues

## ✅ Version stable : v1.0-auth-final

Cette version intègre et valide toutes les fonctionnalités suivantes :

---

## 🔐 Authentification complète (Supabase)

- Inscription avec rôle (professeur ou élève)
- Vérification d'email via lien Supabase
- Connexion avec redirection automatique selon le rôle :
  - `/dashboard` pour les élèves
  - `/prof-dashboard` pour les professeurs
- Réinitialisation de mot de passe :
  - Envoi d'email avec redirection personnalisée
  - Formulaire sécurisé de nouveau mot de passe

---

## 🛡️ Protection des routes frontend

- `Dashboard.js` :
  - Accessible uniquement aux élèves
  - Redirection automatique des profs vers `/prof-dashboard`
- `ProfDashboard.js` :
  - Accessible uniquement aux professeurs
  - Redirection automatique des élèves vers `/dashboard`
- Si aucune session : redirection automatique vers `/` (login)

---

## ⚙️ Configuration environnement `.env`

```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxxxx
REACT_APP_API_URL=http://localhost:3001
```

> Exemple disponible dans `.env.example`

---

## 📦 Commandes utiles

### Lancer le frontend
```bash
npm start
```

### Vérifier la branche actuelle
```bash
git branch
```

### Ajouter un tag de version stable
```bash
git tag -a v1.0-auth-final -m "Version stable avec protection auth complète"
git push origin v1.0-auth-final
```

---

## 📂 Structure des fichiers clés

- `src/App.js` → Déclaration des routes
- `src/supabaseClient.js` → Configuration Supabase (redirection incluse)
- `src/pages/Register.js`, `Login.js` → Connexion, inscription, rôle
- `src/pages/ForgotPassword.js`, `ResetPassword.js` → Réinitialisation du mot de passe
- `src/pages/Dashboard.js` → Élèves uniquement
- `src/pages/ProfDashboard.js` → Professeurs uniquement
- `src/config.js` → Centralisation des endpoints et redirections

---

## ✅ Statut : validé avec Git

Tu es actuellement sur la branche `main` avec les dernières améliorations commités.  
Un tag `v1.0-auth-final` est disponible pour retrouver cette version stable à tout moment.
