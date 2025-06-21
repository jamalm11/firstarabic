# Intégration Stripe - API FirstArabic

Ce guide décrit comment fonctionne l’intégration Stripe dans le projet FirstArabic pour la gestion des abonnements.

---

## 🎯 Fonctionnalités supportées

- Création d'une session Stripe Checkout pour abonnement.
- Paiement via Stripe.
- Réception automatique de l’événement `checkout.session.completed` via un webhook.
- Insertion automatique dans la table `abonnements` de Supabase.

---

## ⚙️ Configuration du fichier `.env`

Ajoutez les lignes suivantes dans votre fichier `.env` :

```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_UNE_SEANCE_ID=price_1QEuUsKvTEWAyt2Id6aAq3V6
STRIPE_PRICE_DEUX_SEANCES_ID=price_1QEumOKvTEWAyt2ICWQFYC2r
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxx
```

> ✅ `STRIPE_SECRET_KEY` : clé API Stripe (mode live ou test)
> ✅ `STRIPE_PRICE_UNE_SEANCE_ID` : ID Stripe pour l’abonnement 1 séance/semaine
> ✅ `STRIPE_PRICE_DEUX_SEANCES_ID` : ID Stripe pour l’abonnement 2 séances/semaine
> ✅ `STRIPE_WEBHOOK_SECRET` : générée lors du test via Stripe CLI

---

## 🚀 Lancement Stripe CLI pour tester en local

Dans un terminal séparé, exécute :

```
stripe listen --forward-to localhost:3001/stripe/webhook
```

Cela affiche un secret de webhook à copier dans `.env` (`STRIPE_WEBHOOK_SECRET`).

---

## 📡 Endpoints API

### POST /abonnements/checkout

Créer une session Stripe pour un abonnement.

**Headers** :
- Authorization: Bearer <JWT>
- Content-Type: application/json

**Body JSON** :
```
{
  "abonnement_type": "mensuel"
}
```

Valeurs possibles pour `abonnement_type` : `"mensuel"` ou `"annuel"`

**Réponse JSON** :
```
{
  "sessionId": "...",
  "url": "https://checkout.stripe.com/..."
}
```

---

## ✅ Paiement réussi : Stripe envoie l’événement

Stripe envoie automatiquement `checkout.session.completed` vers :

```
POST /stripe/webhook
```

Ce webhook est géré par `paiementController.js`. L’API vérifie la signature, extrait les données et insère un abonnement dans Supabase :

- user_id
- abonnement_type
- stripe_subscription_id
- start_date
- status = 'actif'

---

## 🔍 Vérification

Utilisez `docker logs -f firstarabic-api` pour voir :

- La réception du webhook
- Les logs d’insertion dans Supabase
- Les éventuelles erreurs Stripe

Dans Stripe CLI vous devez voir :

```
--> checkout.session.completed
<-- [200] POST /stripe/webhook
```

---

## 🗂️ Fichiers impliqués

- `backend/controllers/abonnementController.js` → création session Stripe
- `backend/controllers/paiementController.js` → réception du webhook
- `backend/index.js` → routes `/abonnements/checkout` et `/stripe/webhook`

---

## 🧪 Exemple complet de test avec `curl`

```
curl -X POST http://localhost:3001/abonnements/checkout \
  -H "Authorization: Bearer <VOTRE_JWT_ICI>" \
  -H "Content-Type: application/json" \
  -d '{"abonnement_type": "mensuel"}'
```

---

## 📌 Notes

- Mode Stripe utilisé : `subscription` (et non `payment`)
- Les `price_...` doivent être configurés dans Stripe en mode récurrent
- Toujours redémarrer l’API après avoir modifié `.env`

---
