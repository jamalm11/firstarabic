# Étape de construction
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances système utiles à node-gyp (par précaution)
RUN apk add --no-cache curl python3 make g++

# Copier les fichiers de dépendances
COPY package*.json ./

# ✅ Installer dotenv (au cas où il manque dans le lock file)
RUN npm install dotenv && \
    npm ci --ignore-scripts && \
    npm cache clean --force

# Étape d'exécution
FROM node:20-alpine

WORKDIR /app

# Copier les dépendances installées depuis le builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code de l'application
COPY . .

# Donner les bons droits
RUN chown -R node:node /app && \
    apk add --no-cache curl

# Exécution en tant qu'utilisateur non-root
USER node

# Exposer le port de l'API
EXPOSE 3001

# Définir une vérification de santé
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/ || exit 1

# Commande de démarrage
CMD ["npm", "start"]
