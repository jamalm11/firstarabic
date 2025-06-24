const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ❗️ Utiliser la clé service_role ici
);

const ensureProfile = async (req, res, next) => {
  const user = req.user;
  if (!user || !user.id) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  const role = user.user_metadata?.role || "eleve";
  const nom = user.user_metadata?.full_name || user.email || "Utilisateur";
  const email = user.email || null;

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
          console.log(`✅ Élève créé : ${nom} (${email})`);
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
          console.log(`✅ Professeur créé : ${nom} (${email})`);
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
