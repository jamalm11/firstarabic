// backend/controllers/paiementController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const handleStripeWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Erreur de signature webhook :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Événement reçu : ${event.type}`);

  // Exemple : traiter les événements
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log("💰 Paiement réussi :", paymentIntent.id);
    // TODO : mettre à jour l'abonnement de l'utilisateur, etc.
  }

  res.status(200).send("ok");
};

module.exports = { handleStripeWebhook };

