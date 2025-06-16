#!/bin/bash

echo "📅 Test création de réservation avec disponibilité vérifiée"

# Remplace par un vrai token d'élève authentifié
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDMwMDU2LCJpYXQiOjE3NTAwMjY0NTYsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwMjY0NTZ9XSwic2Vzc2lvbl9pZCI6ImM5MzAxNzc0LWJjN2EtNDI0NC1iNDcyLTJiZmY1OTYxZDY0ZSIsImlzX2Fub255bW91cyI6ZmFsc2V9.lwvI4nb27-O9yKobQL5EfQM50mYjajBapssjjnFpqpg"

# UUIDs réels d'élève et de professeur
ELEVE_ID="rempli_automatiquement_par_token"
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"

# Date et heures compatibles avec une disponibilité réelle du prof (par ex. mercredi 14h–17h)
DATE="2025-06-18"            # mercredi
HEURE_DEBUT="14:30"
HEURE_FIN="15:00"
STATUT="en_attente"

curl -X POST http://localhost:3001/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
        \"prof_id\": \"$PROF_ID\",
        \"date\": \"$DATE\",
        \"heure_debut\": \"$HEURE_DEBUT\",
        \"heure_fin\": \"$HEURE_FIN\",
        \"statut\": \"$STATUT\"
      }"
