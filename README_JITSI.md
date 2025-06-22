# Module Envoi d’Emails – Plateforme FirstArabic

Ce module permet d’envoyer automatiquement un email de notification à l’élève et au professeur lorsqu’un nouveau cours est créé. Il utilise Nodemailer avec un compte Gmail et un mot de passe d’application.

-------------------------------
✅ Fonctionnalité :
-------------------------------
Quand un cours est créé via POST /cours :
1. Lien Jitsi généré.
2. Email du prof et de l’élève récupérés.
3. Notification envoyée à chacun.

-------------------------------
⚙️ Étapes à suivre :
-------------------------------

1. Fichier backend/package.json :

{
  "name": "firstarabic-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.50.0",
    "dotenv": "^16.5.0",
    "express": "^4.18.2",
    "joi": "^17.13.3",
    "nodemailer": "^6.9.13",
    "stripe": "^12.15.0",
    "dayjs": "^1.11.10"
  }
}

Puis exécuter :
cd backend
npm install

2. Fichier backend/.env :

EMAIL_USER=firstarabic.link@gmail.com
EMAIL_PASS=mot_de_passe_application_gmail

3. Fichier backend/utils/email.js :

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`📧 Email envoyé à ${to}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email à ${to}:`, error.message);
  }
}

module.exports = { sendEmail };

4. Modification dans backend/index.js (dans POST /cours) :

const { sendEmail } = require('./utils/email');

const { data: profData } = await req.supabase
  .from('profs').select('email').eq('id', prof_id).maybeSingle();
const { data: eleveData } = await req.supabase
  .from('eleves').select('email').eq('id', eleve_id).maybeSingle();

const emailBody = `
  <p>Un nouveau cours a été programmé.</p>
  <p>Date : ${date}</p>
  <p>Lien Jitsi : <a href="${jitsi_url}">${jitsi_url}</a></p>
`;

if (profData?.email) await sendEmail(profData.email, "Nouveau cours", emailBody);
if (eleveData?.email) await sendEmail(eleveData.email, "Nouveau cours", emailBody);

5. Dockerfile :

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl python3 make g++
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
COPY .env .env
RUN chown -R node:node /app && apk add --no-cache curl
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/ || exit 1
CMD ["npm", "start"]

-------------------------------
🧪 Test Final :
-------------------------------

docker-compose down -v && docker-compose up -d --build

curl -X POST http://localhost:3001/cours \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-06-22T10:00:00","prof_id":"UUID_PROF","eleve_id":"UUID_ELEVE"}'

Sur docker logs :
📧 Email envoyé à kenzihand@gmail.com
📧 Email envoyé à jamal.marouane@gmail.com

✅ Tout est opérationnel.
