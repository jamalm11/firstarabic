#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5ODEzMDM4LCJpYXQiOjE3NDk4MDk0MzgsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk4MDk0Mzh9XSwic2Vzc2lvbl9pZCI6Ijk1YmNiZTU5LTgwNTYtNGI0Yi1hMDk3LTUwMmNhMDFiNDVhOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.5LBKM_jBQ4IWOM-P8UKKy-fQIbNF0G7QNUj5dfkb0TI"  # ton JWT ici
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"  # un ID de prof existant (créé par toi)

DISPO=$(jq -n \
  --arg jour "lundi" \
  --arg heure_debut "09:00" \
  --arg heure_fin "12:00" \
  --arg prof_id "$PROF_ID" \
  '{
    jour: $jour,
    heure_debut: $heure_debut,
    heure_fin: $heure_fin,
    prof_id: $prof_id
  }'
)

echo "1. Création d'une disponibilité"
RESPONSE=$(curl -s -X POST http://localhost:3001/disponibilites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DISPO")

echo "Réponse : $RESPONSE"

# Extraction de l'ID
DISPO_ID=$(echo "$RESPONSE" | jq -r '.id // empty')

if [[ -n "$DISPO_ID" ]]; then
  echo "✅ Créée avec ID : $DISPO_ID"
else
  echo "❌ Échec création ou extraction de l'ID"
fi
