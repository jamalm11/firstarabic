#!/bin/bash

echo "📋 Test complet des opérations sur les réservations"

# Authentification et infos
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDY2MzM5LCJpYXQiOjE3NTAwNjI3MzksImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwNjI3Mzl9XSwic2Vzc2lvbl9pZCI6ImExOTMyNzJlLTU3YjUtNDk2Mi05YzVjLTlkZDMyNWE2ZjM2ZSIsImlzX2Fub255bW91cyI6ZmFsc2V9.MDzaK0Tper4429mAFw4M-tJaqdf-uVOjT9mY0PSjLvU"
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"
DATE="2025-06-18"
HEURE_DEBUT="14:00"
HEURE_FIN="14:30"
STATUT="en_attente"

echo "🔹 Création d'une réservation"
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
        \"prof_id\": \"$PROF_ID\",
        \"date\": \"$DATE\",
        \"heure_debut\": \"$HEURE_DEBUT\",
        \"heure_fin\": \"$HEURE_FIN\",
        \"statut\": \"$STATUT\"
      }")

echo "$CREATE_RESPONSE"

ID=$(echo "$CREATE_RESPONSE" | jq -r '.reservation.id')

if [ -z "$ID" ] || [ "$ID" == "null" ]; then
  echo "❌ Échec lors de la création de la réservation ou réponse invalide"
  echo "Réponse brute : $CREATE_RESPONSE"
  exit 1
fi

echo ""
echo "🔹 Liste des réservations"
curl -s -X GET http://localhost:3001/reservations \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "🔹 Détail de la réservation créée (ID: $ID)"
curl -s -X GET http://localhost:3001/reservations/$ID \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "🔹 Mise à jour de la réservation"
curl -s -X PUT http://localhost:3001/reservations/$ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
        \"statut\": \"confirmee\",
        \"heure_debut\": \"15:30\",
        \"heure_fin\": \"16:00\"
      }" | jq .

echo ""
echo "🔹 Suppression de la réservation"
curl -s -X DELETE http://localhost:3001/reservations/$ID \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "🔹 Vérification de suppression"
curl -s -X GET http://localhost:3001/reservations/$ID \
  -H "Authorization: Bearer $TOKEN" | jq .
