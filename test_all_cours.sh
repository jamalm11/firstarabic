#!/bin/bash

echo "📋 Test complet des opérations sur les cours"

# === Données fixes ===
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDc2OTEyLCJpYXQiOjE3NTAwNzMzMTIsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwNzMzMTJ9XSwic2Vzc2lvbl9pZCI6ImJhMDRjNWU2LWVmM2EtNDI3ZS1hY2RjLTRjZTQ2ZmJhZDRlZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.1RnWwAxfW1N4KAy26iXRjFQ62IyP14OY_sFyZ2w327Q"
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"
ELEVE_ID="49cbcbbc-411e-48e0-bc98-c756e538de11"
DATE="2025-06-20T10:00:00"

# === Création d'un cours ===
echo "🔹 Création d’un cours"
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/cours \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'"$DATE"'",
    "prof_id": "'"$PROF_ID"'",
    "eleve_id": "'"$ELEVE_ID"'"
  }')

echo "$CREATE_RESPONSE"
COURS_ID=$(echo "$CREATE_RESPONSE" | jq -r '.cours.id')

if [ -z "$COURS_ID" ] || [ "$COURS_ID" == "null" ]; then
  echo "❌ Échec lors de la création du cours ou réponse invalide"
  echo "Réponse brute : $CREATE_RESPONSE"
  exit 1
fi

# === Récupération de tous les cours ===
echo ""
echo "🔹 Liste des cours"
curl -s -X GET http://localhost:3001/cours \
  -H "Authorization: Bearer $TOKEN" | jq .

# === Détail du cours créé ===
echo ""
echo "🔹 Détail du cours (ID: $COURS_ID)"
curl -s -X GET http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN" | jq .

# === Mise à jour du cours ===
echo ""
echo "🔹 Mise à jour du cours (statut = reporte)"
curl -s -X PUT http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "reporte"
  }' | jq .

# === Suppression du cours ===
echo ""
echo "🔹 Suppression du cours"
curl -s -X DELETE http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN" | jq .

# === Vérification de suppression ===
echo ""
echo "🔹 Vérification de suppression"
curl -s -X GET http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
