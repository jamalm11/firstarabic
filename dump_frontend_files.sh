#!/bin/bash

# Nom du fichier de sortie
OUTPUT_FILE="frontend_dump.txt"
echo "" > "$OUTPUT_FILE"  # vider si existe déjà

# Liste manuelle des fichiers frontend (à adapter si besoin)
FILES=(
  "frontend/package.json"
  "frontend/.env"
  "frontend/.gitignore"
  "frontend/tailwind.config.js"
  "frontend/postcss.config.js"
  "frontend/vite.config.js"
  "frontend/index.html"
  "frontend/src/main.jsx"
  "frontend/src/App.js"
  "frontend/src/supabaseClient.js"
  "frontend/src/components/Header.js"
  "frontend/src/components/Footer.js"
  "frontend/src/components/PrivateRoute.js"
  "frontend/src/pages/Login.js"
  "frontend/src/pages/Register.js"
  "frontend/src/pages/ForgotPassword.js"
  "frontend/src/pages/Dashboard.js"
  "frontend/src/pages/ProfDashboard.js"
  "frontend/src/pages/Planning.js"
  "frontend/src/pages/Reservation.js"
  "frontend/src/pages/Professeurs.js"
  "frontend/src/pages/Cours.js"
  "frontend/src/pages/Abonnement.js"
  "frontend/src/pages/Success.js"
  "frontend/src/pages/Cancel.js"
  "frontend/src/utils/api.js"
  "frontend/src/utils/helpers.js"
  "frontend/src/hooks/useAuth.js"
  "frontend/src/context/AuthContext.js"
)

# Boucle sur chaque fichier
for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo -e "\n\n======================\n# $file\n======================\n" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
  else
    echo -e "\n[⚠️] Fichier non trouvé : $file" >> "$OUTPUT_FILE"
  fi
done

echo "✅ Dump terminé : contenu sauvegardé dans $OUTPUT_FILE"
