// backend/routes/checkEmailRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const supabaseAdmin = require("../supabaseAdminClient");

const router = express.Router();

// 🛡️ Limiteur anti-abus : max 5 requêtes toutes les 15 minutes
const emailCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Trop de tentatives. Réessayez plus tard.",
});

// 📬 Vérifie si l'email est déjà utilisé (auth.users)
router.post("/", emailCheckLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Format d'email invalide" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Erreur Supabase" });
    }

    const exists = data.users.some((u) => u.email === email);
    console.log(`🔍 Vérif email : ${email} → ${exists ? "EXISTE" : "DISPO"}`);

    return res.json({ exists });
  } catch (err) {
    console.error("❌ Exception:", err);
    return res.status(503).json({ error: "Service indisponible" });
  }
});

module.exports = router;
