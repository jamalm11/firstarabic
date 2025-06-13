#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5Nzg5MDU5LCJpYXQiOjE3NDk3ODU0NTksImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk3ODU0NTl9XSwic2Vzc2lvbl9pZCI6ImM0NmYzZDNjLTFjNDktNGFjNi04MjkyLWU3YTBjMTRhZmFmZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.RdbayG2nHf8WQAVyxOn__gydH3NDQQ5AdEBU4siTSY8"
NOTIF_ID=""



echo "1. Création d’une notification"
RESPONSE=$(curl -s -X POST http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Votre prochain cours commence bientôt !", "type": "alerte"}')

echo "Réponse brute : $RESPONSE"

# Extraire l'ID si possible
NOTIF_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | cut -d: -f2 | tr -d ' ')

if [ -z "$NOTIF_ID" ]; then
  echo "❌ Échec lors de la récupération de l'ID de la notification."
  exit 1
fi

echo -e "\n2. Récupération de mes notifications"
curl -s -X GET http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "3. Marquer une notification comme lue (ID: $NOTIF_ID)"
curl -s -X PUT http://localhost:3001/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "4. Supprimer la notification (ID: $NOTIF_ID)"
curl -s -X DELETE http://localhost:3001/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"
