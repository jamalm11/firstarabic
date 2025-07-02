// backend/routes/stripeRoutes.js
const express = require("express");
const paiementController = require("../controllers/paiementController");

const router = express.Router();

// ⚠️ Stripe exige express.raw() pour lire les webhooks correctement
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paiementController.handleStripeWebhook
);

module.exports = router;
