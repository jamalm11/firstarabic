#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5OTY2ODIzLCJpYXQiOjE3NDk5NjMyMjMsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk5NjMyMjN9XSwic2Vzc2lvbl9pZCI6IjllODI1MDQxLWRjNDItNDFkOC1iNGEyLTE2MGYyMDViY2IyMCIsImlzX2Fub255bW91cyI6ZmFsc2V9.lBEgqRnfotu6tiQoTTPY4RQTTnWCBbS91quE9mYEB9M"
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"
ELEVE_ID="49cbcbbc-411e-48e0-bc98-c756e538de11"
COURS_ID="11"

echo "1. Creation d’un cours"
curl -X POST http://localhost:3001/cours \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-06-15T10:00:00",
    "prof_id": "'$PROF_ID'",
    "eleve_id": "'$ELEVE_ID'"
  }'
echo -e "\n"

echo "2. Recuperation de tous les cours"
curl -X GET http://localhost:3001/cours \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "3. Recuperation d’un cours par ID"
curl -X GET http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "4. Mise à jour du cours"
curl -X PUT http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-06-20T14:00:00",
    "statut": "reporte"
  }'
echo -e "\n"

echo "5. Suppression du cours"
curl -X DELETE http://localhost:3001/cours/$COURS_ID \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

