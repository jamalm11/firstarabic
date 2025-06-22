# Étape de construction
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances système utiles à node-gyp (par précaution)
RUN apk add --no-cache curl python3 make g++

# Copier les fichiers de dépendances
COPY package*.json ./

# ✅ Installer toutes les dépendances
RUN npm ci --ignore-scripts && npm cache clean --force

# Étape d'exécution
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .
COPY .env .env

RUN chown -R node:node /app && \
    apk add --no-cache curl

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/ || exit 1

CMD ["npm", "start"]
