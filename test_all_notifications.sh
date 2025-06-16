#!/bin/bash

echo "📋 Test complet des opérations sur les notifications"

TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDc2OTEyLCJpYXQiOjE3NTAwNzMzMTIsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwNzMzMTJ9XSwic2Vzc2lvbl9pZCI6ImJhMDRjNWU2LWVmM2EtNDI3ZS1hY2RjLTRjZTQ2ZmJhZDRlZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.1RnWwAxfW1N4KAy26iXRjFQ62IyP14OY_sFyZ2w327Q"

echo "🔹 1. Création d'une notification"
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Rappel de cours",
    "message": "Votre cours commence dans 1h."
  }')
echo "$CREATE_RESPONSE"

NOTIF_ID=$(echo "$CREATE_RESPONSE" | jq -r '.notification.id')

echo -e "\n🔹 2. Récupération de toutes les notifications"
curl -s -X GET http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n🔹 3. Marquer la notification comme lue"
curl -s -X PUT http://localhost:3001/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n🔹 4. Suppression de la notification"
curl -s -X DELETE http://localhost:3001/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n🔹 5. Vérification de suppression"
curl -s -X GET http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN" | jq
