FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache curl python3 make g++

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

RUN apk add --no-cache curl && chown -R node:node /app

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/ || exit 1

CMD ["npm", "start"]
