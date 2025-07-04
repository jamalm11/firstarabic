// backend/middleware/authenticateToken.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const authenticateToken = async (req, res, next) => {
  console.log("🔐 [Middleware] authenticateToken appelé");

  const rawAuthHeader = req.headers.authorization;
  console.log("📥 Header Authorization brut :", rawAuthHeader);

  const token = rawAuthHeader?.split(" ")[1];

  if (!token) {
    console.warn("🚫 Token manquant dans l'en-tête Authorization");
    return res.status(401).json({ error: "Token manquant" });
  }

  console.log("🔑 Token extrait :", token);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });

    console.log("🔄 Appel à supabase.auth.getUser()...");
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (error || !user) {
      console.warn("🚫 Token invalide ou utilisateur introuvable", error?.message || "");
      return res.status(401).json({ error: "Token invalide ou utilisateur non trouvé" });
    }

    console.log(`✅ Utilisateur authentifié : ${user.email} (ID: ${user.id})`);
    req.user = user;
    req.supabase = supabase;

    console.log("➡️ Passage au middleware suivant");
    next();
  } catch (err) {
    console.error("❌ Erreur dans authenticateToken :", err.message);
    res.status(500).json({ error: "Erreur d'authentification", details: err.message });
  }
};

module.exports = authenticateToken;
