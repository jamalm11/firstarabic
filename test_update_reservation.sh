#!/bin/bash

echo "✏️  Test mise à jour d'une réservation existante"

# Remplace par un vrai token d'élève authentifié
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDYwNDg3LCJpYXQiOjE3NTAwNTY4ODcsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwNTY4ODd9XSwic2Vzc2lvbl9pZCI6IjdjZWVmNDZhLTdmYjQtNGRmZS04ODY1LWMxMGI0Y2E1N2YzOCIsImlzX2Fub255bW91cyI6ZmFsc2V9.HAATj--VL5XxrU5diUh2n1mE-OJuJHvRmNZZRXVCVvk"

# ID de réservation à mettre à jour (tu peux aussi automatiser avec une requête GET)
RESERVATION_ID="90f42362-18d2-4b86-b794-1a0d76e39ba6"

# Nouveau créneau + statut
NOUVELLE_DATE="2025-06-18"
NOUVELLE_HEURE_DEBUT="15:30"
NOUVELLE_HEURE_FIN="16:00"
NOUVEAU_STATUT="confirmee"

# Prof reste le même (si modifiable, mets à jour)
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528"

curl -X PUT http://localhost:3001/reservations/$RESERVATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
        \"prof_id\": \"$PROF_ID\",
        \"date\": \"$NOUVELLE_DATE\",
        \"heure_debut\": \"$NOUVELLE_HEURE_DEBUT\",
        \"heure_fin\": \"$NOUVELLE_HEURE_FIN\",
        \"statut\": \"$NOUVEAU_STATUT\"
      }"
