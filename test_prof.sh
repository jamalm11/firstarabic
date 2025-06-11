#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5NjQ1MTUzLCJpYXQiOjE3NDk2NDE1NTMsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk2NDE1NTN9XSwic2Vzc2lvbl9pZCI6IjhiNDJmMGFiLTMxODYtNGFkOC1hYTc3LTYxMDZhNGRkN2NiOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.zQ3JruaijmcJSH0An_beLnJra-ped26eHgg52TPHoNI"

echo "1. Création d’un profil prof"
curl -s -X POST http://localhost:3001/prof \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom": "Prof Test", "specialite": "Arabe", "bio": "10 ans d’expérience"}'
echo -e "\n"

echo "2. Lecture de mon propre profil"
curl -s -X GET http://localhost:3001/prof/me \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "3. Liste publique des profs validés"
curl -s -X GET http://localhost:3001/profs
echo -e "\n"
