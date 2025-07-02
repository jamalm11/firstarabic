// backend/routes/abonnementRoutes.js
const express = require("express");
const abonnementController = require("../controllers/abonnementController");
const paiementController = require("../controllers/paiementController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// 🔐 Stripe Webhook (⚠️ sans middleware JSON classique)
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  paiementController.handleStripeWebhook
);

// 📦 Récupérer les abonnements de l'utilisateur connecté
router.get("/", authenticateToken, abonnementController.getAbonnementsForUser);

// 🔒 Récupérer tous les abonnements (admin ou gestion globale)
router.get("/all", authenticateToken, abonnementController.getAllAbonnements);

// 🚀 Démarrer une session de paiement Stripe
router.post("/checkout", authenticateToken, abonnementController.createCheckoutSession);

module.exports = router;
