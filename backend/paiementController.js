const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Erreur de signature Stripe :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🔔 Paiement réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customer_email = session.customer_details.email;

    // 📌 Ici tu peux : 
    // - Créer un compte élève
    // - Activer son accès
    // - Mettre à jour un statut "premium"
    console.log("✅ Paiement réussi pour :", customer_email);
  }

  res.json({ received: true });
};
