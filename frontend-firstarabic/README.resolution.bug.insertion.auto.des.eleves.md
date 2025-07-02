## ✅ Résolution du bug d'insertion automatique des élèves

### 🔍 Problème initial

Lorsqu’un utilisateur s’inscrivait avec le rôle `élève`, Supabase créait bien son compte dans `auth.users`,
mais aucune entrée correspondante n’était insérée dans la table `eleves`, provoquant une erreur lors de l'accès au planning ou à la réservation.

Messages d'erreur observés :
- Frontend : ❌ Élève non trouvé
- Backend : ❌ Données invalides: "created_by" is required

### 🧠 Cause identifiée

La politique RLS de la table `eleves` empêchait l’insertion :

    CREATE POLICY "Créer un élève"
    ON eleves
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

Le backend ne renseignait pas le champ `created_by`, donc Supabase rejetait l’insertion (car `auth.uid()` ≠ null).

### 🛠️ Solution appliquée

1. Correction du backend (routes/elevesRoutes.js) :

Ajout de l’insertion explicite du champ `created_by` récupéré via le token JWT :

    const userId = req.user?.id;

    const { data, error } = await supabaseAdmin
      .from('eleves')
      .insert([{ nom, email, created_by: userId }])
      .select();

2. Correction du frontend (Dashboard.js) :

Ajout d’un useEffect qui :
- vérifie si l’élève existe déjà via `GET /eleves`
- sinon, déclenche l’insertion via `POST /eleves`

Extrait :

    if (!found) {
      await axios.post("/eleves", {
        nom: session.user.email,
        email: session.user.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

3. Ajout d’une contrainte unique en base sur `created_by`
pour éviter l’insertion multiple en cas de requêtes en double.

### ✅ Résultat final

- L’élève est automatiquement inséré dès la première connexion.
- Plus d’erreur de type "élève non trouvé".
- Aucune duplication possible grâce à la contrainte sur `created_by`.

### 🔐 Sécurité

- Le champ `created_by` est injecté exclusivement côté backend.
- La RLS empêche un utilisateur d’injecter un autre `user_id`.

### 🧪 Tests réalisés

- Création automatique fonctionnelle dès la première connexion ✅
- Réservation possible juste après inscription ✅
- Tentatives multiples ne créent pas de doublons ✅
