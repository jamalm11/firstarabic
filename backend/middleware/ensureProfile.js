// backend/middleware/ensureProfile.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ensureProfile = async (req, res, next) => {
  const user = req.user;
  console.log("🧪 ensureProfile - req.user :", user);

  if (!user || !user.id) {
    console.warn("🚫 Aucun utilisateur authentifié dans req.user");
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  const role = user.user_metadata?.role || "eleve";
  const nom = user.user_metadata?.full_name || user.email || "Utilisateur";
  const email = user.email || null;

  console.log(`🔍 ensureProfile - Détection utilisateur : ${email} (rôle : ${role})`);

  try {
    if (role === "eleve") {
      const { data, error } = await supabaseAdmin
        .from("eleves")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle();

      if (!data && !error) {
        const { error: insertError } = await supabaseAdmin
          .from("eleves")
          .insert([{ nom, email, created_by: user.id }]);

        if (insertError) {
          console.error("❌ Erreur insertion élève :", insertError.message);
        } else {
          console.log(`✅ Élève ajouté : ${nom} (${email})`);
        }
      }
    } else if (role === "prof") {
      const { data, error } = await supabaseAdmin
        .from("profs")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle();

      if (!data && !error) {
        const { error: insertError } = await supabaseAdmin
          .from("profs")
          .insert([{ nom, email, created_by: user.id, is_validated: false }]);

        if (insertError) {
          console.error("❌ Erreur insertion prof :", insertError.message);
        } else {
          console.log(`✅ Prof ajouté : ${nom} (${email})`);
        }
      }
    }

    next();
  } catch (e) {
    console.error("❌ Erreur ensureProfile :", e.message);
    return res.status(500).json({ error: "Erreur création du profil" });
  }
};

module.exports = ensureProfile;
