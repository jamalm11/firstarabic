#!/bin/bash

docker run --rm -it \
  -v "$(pwd)/backend:/app" \
  -w /app \
  --env-file .env \
  node:20-alpine \
  sh -c "npm install dotenv @supabase/supabase-js && node login.js"
