// backend/controllers/abonnementController.js

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Récupérer les abonnements d’un utilisateur
const getAbonnementsForUser = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .eq('user_id', user_id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error("Erreur Supabase:", error);
      return res.status(500).json({ error: "Erreur récupération abonnements", details: error.message });
    }

    res.json({ success: true, abonnements: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur", details: e.message });
  }
};

// ✅ Récupérer tous les abonnements (admin)
const getAllAbonnements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error("Erreur Supabase (admin):", error);
      return res.status(500).json({ error: "Erreur récupération abonnements (admin)", details: error.message });
    }

    res.json({ success: true, abonnements: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur", details: e.message });
  }
};

// ✅ Créer une session Stripe
const createCheckoutSession = async (req, res) => {
  try {
    const { abonnement_type } = req.body;
    const user_id = req.user.id;

    if (!abonnement_type) {
      return res.status(400).json({ error: "Type d’abonnement requis" });
    }

    // 💰 Prix selon le type
    const price_lookup = {
      mensuel: process.env.STRIPE_PRICE_UNE_SEANCE_ID,
      annuel: process.env.STRIPE_PRICE_DEUX_SEANCES_ID
    };

    const price = price_lookup[abonnement_type];
    if (!price) {
      return res.status(400).json({ error: "Type d’abonnement invalide" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: 'https://firstarabic.com/success',
      cancel_url: 'https://firstarabic.com/cancel',
      metadata: {
        user_id,
        abonnement_type
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("❌ Erreur Stripe:", err);
    console.error("Erreur création session Stripe:", err.message);
    res.status(500).json({ error: "Erreur création session Stripe" });
  }
};

module.exports = {
  getAbonnementsForUser,
  getAllAbonnements,
  createCheckoutSession
};
