#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5ODIxNTIyLCJpYXQiOjE3NDk4MTc5MjIsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk4MTc5MjJ9XSwic2Vzc2lvbl9pZCI6ImU2ZDEyY2VlLTA2NmUtNDkxNy1iMGUzLWQ2MDA5MjE0ZmI4OCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Zj1Z79qlM2Nbe2hIE7AuKQslHZMak4rt0d9j-Vjgio0"
ID_DISPO=10  # Remplace par l'ID d'une disponibilité existante

NOUVELLE_DISPO='{
  "jour": "mercredi",
  "heure_debut": "14:00",
  "heure_fin": "17:00"
}'

echo "✏️ 3. Mise à jour (PATCH) d'une disponibilité"
RESPONSE=$(curl -s -X PATCH http://localhost:3001/disponibilites/$ID_DISPO \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NOUVELLE_DISPO")

echo "Réponse : $RESPONSE"
