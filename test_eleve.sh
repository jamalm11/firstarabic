#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5OTY2ODIzLCJpYXQiOjE3NDk5NjMyMjMsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk5NjMyMjN9XSwic2Vzc2lvbl9pZCI6IjllODI1MDQxLWRjNDItNDFkOC1iNGEyLTE2MGYyMDViY2IyMCIsImlzX2Fub255bW91cyI6ZmFsc2V9.lBEgqRnfotu6tiQoTTPY4RQTTnWCBbS91quE9mYEB9M"

echo "1. Création d’un élève"
curl -s -X POST http://localhost:3001/eleve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Tariq"}'
echo -e "\n"

echo "2. Liste de mes élèves"
curl -s -X GET http://localhost:3001/eleves \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

ELEVE_ID=$(curl -s -X GET http://localhost:3001/eleves \
  -H "Authorization: Bearer $TOKEN" | jq -r '.eleves[0].id')

echo "3. Détail d’un élève"
curl -s -X GET http://localhost:3001/eleve/$ELEVE_ID \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "4. Mise à jour de l’élève"
curl -s -X PUT http://localhost:3001/eleve/$ELEVE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Ali Mis à Jour"}'
echo -e "\n"

echo "5. Suppression de l’élève"
curl -s -X DELETE http://localhost:3001/eleve/$ELEVE_ID \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"
