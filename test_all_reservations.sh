#!/bin/bash

echo "📋 Test complet des opérations sur les réservations"

# --- Variables à adapter ---
BASE_URL="http://localhost:3001"
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDU4OTk3LCJpYXQiOjE3NTAwNTUzOTcsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwNTUzOTd9XSwic2Vzc2lvbl9pZCI6IjI4NTNmNjllLTBhOWItNGI1NS1iNWQ4LWRkZTYxZmM2NmFkZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.L1OjYFE7U1fwmv2g4LYG1T09zq-59akbgVXSYRRXWuI"  # Remplace par un vrai token JWT
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"
DATE="2025-06-18"  # mercredi (doit correspondre à une dispo réelle du prof)
HEURE_DEBUT="15:00"
HEURE_FIN="15:30"
STATUT="en_attente"
HEADERS=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# --- Création ---
echo "🔹 Création d'une réservation"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/reservations" \
  "${HEADERS[@]}" \
  -d "{
        \"prof_id\": \"$PROF_ID\",
        \"date\": \"$DATE\",
        \"heure_debut\": \"$HEURE_DEBUT\",
        \"heure_fin\": \"$HEURE_FIN\",
        \"statut\": \"$STATUT\"
      }")
echo "$CREATE_RESPONSE"
RES_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d':' -f2 | tr -d '"')

# --- Liste ---
echo -e "\n🔹 Liste des réservations"
curl -s -X GET "$BASE_URL/reservations" "${HEADERS[@]}" | jq .

# --- Détail ---
if [[ -n "$RES_ID" ]]; then
  echo -e "\n🔹 Détail de la réservation créée (ID: $RES_ID)"
  curl -s -X GET "$BASE_URL/reservations/$RES_ID" "${HEADERS[@]}" | jq .
else
  echo "❌ Aucun ID de réservation trouvé pour la récupération."
fi

# --- Suppression ---
if [[ -n "$RES_ID" ]]; then
  echo -e "\n🔹 Suppression de la réservation"
  curl -s -X DELETE "$BASE_URL/reservations/$RES_ID" "${HEADERS[@]}" | jq .

  echo -e "\n🔹 Vérification de suppression"
  curl -s -X GET "$BASE_URL/reservations/$RES_ID" "${HEADERS[@]}" | jq .
else
  echo "❌ Aucun ID de réservation trouvé pour suppression."
fi
