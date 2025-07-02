// backend/routes/coursRoutes.js
const express = require("express");
const router = express.Router();
const { coursSchema } = require("../validators/coursValidator");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../supabaseAdminClient");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 🔒 Middleware local pour initialiser supabase avec le token du header
const initSupabase = (req) =>
  createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: req.headers.authorization } },
  });

// 📥 Créer un cours
router.post("/", async (req, res) => {
  console.log("✅ [API] POST /cours appelée");
  console.log("📥 Données reçues :", req.body);

  const { error: validationError } = coursSchema.validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: "Données invalides", details: validationError.details[0].message });
  }

  const supabase = initSupabase(req);
  const { date, prof_id, eleve_id } = req.body;

  try {
    const { data: user } = await supabase.auth.getUser();
    const user_id = user?.id;

    // Vérifier que l’élève appartient à l’utilisateur connecté
    const { data: eleve, error: eleveError } = await supabase
      .from("eleves")
      .select("*")
      .eq("id", eleve_id)
      .eq("created_by", user_id)
      .single();

    if (eleveError || !eleve) {
      console.log("🚫 Élève non trouvé ou non accessible");
      return res.status(403).json({ message: "Élève non autorisé ou inexistant" });
    }

    const { error: insertError } = await supabase
      .from("cours")
      .insert([{ date, prof_id, eleve_id }]);

    if (insertError) {
      console.log("❌ Erreur insertion cours :", insertError);
      return res.status(500).json({ message: "Erreur création cours" });
    }

    console.log("✅ Cours créé avec succès");
    return res.status(200).json({ message: "Cours réservé avec succès" });
  } catch (err) {
    console.error("❌ Erreur inattendue :", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📡 Liste des cours enrichis
router.get("/", async (req, res) => {
  const supabase = initSupabase(req);
  try {
    const { data, error } = await supabase
      .from("cours")
      .select(`
        id, date, statut,
        profs (nom),
        eleves (nom)
      `);

    if (error) throw error;

    const cours = data.map(c => ({
      id: c.id,
      date: c.date,
      statut: c.statut,
      prof_nom: c.profs?.nom || null,
      eleve_nom: c.eleves?.nom || null,
    }));

    res.json({ success: true, cours });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération cours", details: e.message });
  }
});

// 📄 Détail d’un cours
router.get("/:id", async (req, res) => {
  const supabase = initSupabase(req);
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("cours")
      .select(`
        id, date, statut, jitsi_url,
        profs (nom),
        eleves (nom)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return res.status(404).json({ error: "Cours introuvable" });

    res.json({
      success: true,
      cours: {
        id: data.id,
        date: data.date,
        statut: data.statut,
        jitsi_url: data.jitsi_url,
        prof_nom: data.profs?.nom || null,
        eleve_nom: data.eleves?.nom || null
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération cours", details: e.message });
  }
});

// 🔄 Mise à jour statut cours
router.put("/:id", async (req, res) => {
  const supabase = initSupabase(req);
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const { data, error } = await supabase.from("cours").update({ statut }).eq("id", id).select();
    if (error) throw error;
    res.json({ success: true, cours: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur mise à jour cours", details: e.message });
  }
});

// ❌ Supprimer un cours
router.delete("/:id", async (req, res) => {
  const supabase = initSupabase(req);
  try {
    const { id } = req.params;
    const { error } = await supabase.from("cours").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true, message: "Cours supprimé" });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression cours", details: e.message });
  }
});

module.exports = router;

