#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5ODA2MTY0LCJpYXQiOjE3NDk4MDI1NjQsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk4MDI1NjR9XSwic2Vzc2lvbl9pZCI6Ijg3ZWM2MGVmLTU3YjYtNDk5OC1iZTEzLTkxMmFkNDcyNWVlZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.mqROks0KVA4As34Eh2VtHDT8_gs60_VhNDoMLoSGDaI"
PROF_ID="dca55991-7463-4035-b8a6-3173450f8528" # À remplacer par un ID réel de votre table profs

DISPO='{
  "jour": "lundi",
  "heure_debut": "09:00",
  "heure_fin": "12:00",
  "prof_id": "'$PROF_ID'"
}'

echo "1. Création d'une disponibilité"
RESPONSE=$(curl -s -X POST http://localhost:3001/disponibilites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DISPO")
