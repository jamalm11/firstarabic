#!/bin/bash

OUTPUT_FILE="backend_full_dump.txt"
echo "" > "$OUTPUT_FILE"  # Vide le fichier de sortie s’il existe déjà

# Liste des fichiers backend à inclure
FILES=$(cat <<EOF
backend/index.js
backend/supabaseClient.js
backend/supabaseAdminClient.js
backend/middleware/authenticateToken.js
backend/validators/coursValidator.js
backend/validators/eleveValidator.js
backend/validators/profValidator.js
backend/routes/abonnementsRoutes.js
backend/routes/coursRoutes.js
backend/routes/elevesRoutes.js
backend/routes/profsRoutes.js
backend/routes/disponibilitesRoutes.js
backend/routes/planningRoutes.js
backend/routes/reservationsRoutes.js
backend/routes/notificationsRoutes.js
backend/routes/stripeWebhook.js
backend/utils/email.js
EOF
)

for file in $FILES; do
  if [[ -f "$file" ]]; then
    echo -e "\n\n====== $file ======\n" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
  else
    echo -e "\n\n====== $file (NOT FOUND) ======\n" >> "$OUTPUT_FILE"
  fi
done

echo "✅ Tous les fichiers ont été concaténés dans $OUTPUT_FILE"
