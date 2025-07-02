const express = require("express");
const router = express.Router();
const { profSchema } = require("../validators/profValidator");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../supabaseAdminClient");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

router.get("/all", async (req, res) => {
  console.log("🔍 Requête GET /profs/all");
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.authorization } },
    });

    const { data, error } = await supabase.from("profs").select("*");
    if (error) throw error;

    res.json({ success: true, profs: data });
  } catch (e) {
    console.error("❌ Erreur récupération profs admin :", e.message);
    res.status(500).json({ error: "Erreur recuperation profs admin", details: e.message });
  }
});

router.put("/:id/valider", async (req, res) => {
  console.log("✅ Validation prof ID :", req.params.id);
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.authorization } },
    });

    const { id } = req.params;
    const { error } = await supabase
      .from("profs")
      .update({ is_validated: true })
      .eq("id", id);
    if (error) throw error;

    res.json({ success: true, message: "Professeur validé" });
  } catch (e) {
    console.error("❌ Erreur validation prof :", e.message);
    res.status(500).json({ error: "Erreur validation prof", details: e.message });
  }
});

router.post("/", async (req, res) => {
  console.log("📝 Création ou mise à jour prof :", req.body);
  try {
    const { error: validationError } = profSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.authorization } },
    });

    const { nom, specialite, bio } = req.body;

    const { data: user } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const { data: existing, error: selectError } = await supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();
    if (selectError) throw selectError;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("profs")
        .update({ nom, specialite, bio })
        .eq("id", existing.id)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      const { data, error } = await supabase
        .from("profs")
        .insert([{ nom, specialite, bio, created_by: userId, is_validated: false }])
        .select();
      if (error) throw error;
      result = data[0];
    }

    res.json({ success: true, prof: result });
  } catch (e) {
    console.error("❌ Erreur création/mise à jour prof :", e.message);
    res.status(500).json({ error: "Erreur enregistrement prof", details: e.message });
  }
});

router.get("/", async (req, res) => {
  console.log("📡 Requête GET /profs (validés uniquement)");
  try {
    const { data, error } = await supabaseAdmin
      .from("profs")
      .select("id, nom, specialite, bio")
      .eq("is_validated", true);
    if (error) throw error;

    res.json({ success: true, profs: data });
  } catch (e) {
    console.error("❌ Erreur récupération profs :", e.message);
    res.status(500).json({ error: "Erreur recuperation profs", details: e.message });
  }
});

router.get("/me", async (req, res) => {
  console.log("👤 Requête GET /prof/me");
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.authorization } },
    });

    const { data: user } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const { data, error } = await supabase
      .from("profs")
      .select("*")
      .eq("created_by", userId)
      .maybeSingle();
    if (error) throw error;

    res.json({ success: true, prof: data });
  } catch (e) {
    console.error("❌ Erreur récupération prof/me :", e.message);
    res.status(500).json({ error: "Erreur récupération profil prof", details: e.message });
  }
});

module.exports = router;
