#!/bin/bash
echo "📋 Test des cas d'erreur pour les notifications"


TOKEN_VALIDE="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDc2OTEyLCJpYXQiOjE3NTAwNzMzMTIsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwNzMzMTJ9XSwic2Vzc2lvbl9pZCI6ImJhMDRjNWU2LWVmM2EtNDI3ZS1hY2RjLTRjZTQ2ZmJhZDRlZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.1RnWwAxfW1N4KAy26iXRjFQ62IyP14OY_sFyZ2w327Q"  # ← Mets ici ton vrai token
TOKEN_INVALIDE="fake.invalid.token"

# 1. Appel sans token
echo "🔹 1. Création sans token (erreur attendue)"
curl -X POST http://localhost:3001/notifications \
  -H "Content-Type: application/json" \
  -d '{"message": "Tentative sans token"}'
echo -e "\n"

# 2. Appel avec token invalide
echo "🔹 2. Création avec token invalide"
curl -X POST http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN_INVALIDE" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tentative avec mauvais token"}'
echo -e "\n"

# 3. Création avec corps vide
echo "🔹 3. Création sans message"
curl -X POST http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN_VALIDE" \
  -H "Content-Type: application/json" \
  -d '{}'
echo -e "\n"

# 4. Marquage de notification inexistante
echo "🔹 4. Marquer comme lue (ID inexistant)"
curl -X PUT http://localhost:3001/notifications/9999 \
  -H "Authorization: Bearer $TOKEN_VALIDE"
echo -e "\n"

# 5. Suppression de notification inexistante
echo "🔹 5. Suppression d'une notification inexistante"
curl -X DELETE http://localhost:3001/notifications/9999 \
  -H "Authorization: Bearer $TOKEN_VALIDE"
echo -e "\n"
