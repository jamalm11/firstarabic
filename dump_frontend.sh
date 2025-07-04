#!/bin/bash

# Nom du fichier de sortie
OUTPUT_FILE="frontend_dump.txt"
echo "" > "$OUTPUT_FILE"  # Vider si existe déjà

# Dossier racine du frontend
FRONTEND_DIR="frontend-firstarabic"

# Liste complète des fichiers frontend (mettre à jour si nécessaire)
FILES=(
  "$FRONTEND_DIR/package.json"
  "$FRONTEND_DIR/.env"
  "$FRONTEND_DIR/.gitignore"
  "$FRONTEND_DIR/tailwind.config.js"
  "$FRONTEND_DIR/postcss.config.js"
  "$FRONTEND_DIR/vite.config.js"
  "$FRONTEND_DIR/index.html"
  "$FRONTEND_DIR/src/main.jsx"
  "$FRONTEND_DIR/src/App.js"
  "$FRONTEND_DIR/src/supabaseClient.js"
  "$FRONTEND_DIR/src/components/Header.js"
  "$FRONTEND_DIR/src/components/Footer.js"
  "$FRONTEND_DIR/src/components/PrivateRoute.js"
  "$FRONTEND_DIR/src/pages/Login.js"
  "$FRONTEND_DIR/src/pages/Register.js"
  "$FRONTEND_DIR/src/pages/ForgotPassword.js"
  "$FRONTEND_DIR/src/pages/Dashboard.js"
  "$FRONTEND_DIR/src/pages/ProfDashboard.js"
  "$FRONTEND_DIR/src/pages/Planning.js"
  "$FRONTEND_DIR/src/pages/Reservation.js"
  "$FRONTEND_DIR/src/pages/Professeurs.js"
  "$FRONTEND_DIR/src/pages/Cours.js"
  "$FRONTEND_DIR/src/pages/Abonnement.js"
  "$FRONTEND_DIR/src/pages/Success.js"
  "$FRONTEND_DIR/src/pages/Cancel.js"
  "$FRONTEND_DIR/src/utils/api.js"
  "$FRONTEND_DIR/src/utils/helpers.js"
  "$FRONTEND_DIR/src/hooks/useAuth.js"
  "$FRONTEND_DIR/src/context/AuthContext.js"
)

# Boucle pour concaténer chaque fichier dans le fichier de sortie
for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo -e "\n\n======================\n# $file\n======================\n" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
  else
    echo -e "\n[⚠️] Fichier non trouvé : $file" >> "$OUTPUT_FILE"
  fi
done

echo "✅ Dump terminé : contenu sauvegardé dans $OUTPUT_FILE"
