// backend/middleware/authenticateToken.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.warn("🚫 Token manquant dans l'en-tête Authorization");
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    req.supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });

    const { data: { user }, error } = await req.supabase.auth.getUser(token);

    if (error || !user) {
      console.warn("🚫 Token invalide ou utilisateur introuvable");
      return res.status(401).json({ error: "Token invalide" });
    }

    console.log(`🔐 Utilisateur authentifié : ${user.email} (${user.id})`);
    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Erreur dans authenticateToken :", err.message);
    res.status(500).json({ error: "Erreur d'authentification" });
  }
};

module.exports = authenticateToken;
