#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImpSLzEyeTNFME5kelZvRnQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Flcmh2eGZ6enB2ZXlra2VkbWVqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjYmM1MzBhNy0wYjJjLTRhYTgtOWVjNC00Y2FlMzQ0OWMzNzAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMDI2MjI3LCJpYXQiOjE3NTAwMjI2MjcsImVtYWlsIjoiamFtYWwubWFyb3VhbmVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTAwMjI2Mjd9XSwic2Vzc2lvbl9pZCI6IjYyNmYzMDBmLWM4ZjAtNGUzYy1iZDc5LTQyOGY0MWU0ODcxOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.ZwOz6eMx6xopOVocCTxbS8qF3xqrSOazzWYcm17idrA"  # 🔐 Colle ici ton token JWT
ENDPOINT="http://localhost:3001/notifications"

echo "📨 Insertion de 10 fausses notifications..."

for i in {1..10}; do
  curl -s -X POST "$ENDPOINT" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Notification test numéro $i\", \"type\": \"info\"}" > /dev/null
done

echo "✅ Insertion terminée."
