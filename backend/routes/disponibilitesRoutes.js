// backend/routes/disponibilitesRoutes.js
const express = require("express");
const router = express.Router();
const { disponibiliteSchema, updateDisponibiliteSchema } = require("../validators/disponibiliteValidator");
const authenticateToken = require("../middleware/authenticateToken");
const supabaseAdmin = require("../supabaseAdminClient");

// 🔒 Middleware
router.use(authenticateToken);

// ✅ Créer une disponibilité
router.post("/", async (req, res) => {
  console.log("🆕 [POST] /disponibilites - Données reçues:", req.body);

  const { error } = disponibiliteSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { jour, heure_debut, heure_fin, prof_id } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from("disponibilites")
      .insert([{ jour, heure_debut, heure_fin, prof_id }])
      .select();

    if (error) throw error;

    res.json({ success: true, disponibilite: data[0] });
  } catch (err) {
    console.error("❌ Erreur création disponibilité:", err);
    res.status(500).json({ error: "Erreur création disponibilité", details: err.message });
  }
});

// ✅ Récupérer toutes les disponibilités

// ✅ Récupérer toutes les disponibilités (MODIFIÉ pour supporter prof_id)
router.get("/", async (req, res) => {
  try {
    const { prof_id } = req.query; // 🆕 Récupérer le prof_id depuis les query params
    
    let query = req.supabase.from("disponibilites").select("*");
    
    // 🆕 Filtrer par prof_id si fourni
    if (prof_id) {
      query = query.eq("prof_id", prof_id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    res.json({ success: true, disponibilites: data });
  } catch (err) {
    console.error("❌ Erreur récupération disponibilités:", err);
    res.status(500).json({ error: "Erreur récupération disponibilités", details: err.message });
  }
});


// router.get("/", async (req, res) => {
//  try {
//    const { data, error } = await req.supabase.from("disponibilites").select("*");
//    if (error) throw error;
//    res.json({ success: true, disponibilites: data });
//  } catch (err) {
//    console.error("❌ Erreur récupération disponibilités:", err);
//    res.status(500).json({ error: "Erreur récupération disponibilités", details: err.message });
//  }
// });

// ✅ Récupérer une disponibilité par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from("disponibilites")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, disponibilite: data });
  } catch (err) {
    console.error("❌ Erreur récupération disponibilité par ID:", err);
    res.status(500).json({ error: "Erreur récupération disponibilité", details: err.message });
  }
});

// ✅ Mettre à jour une disponibilité (PUT)
router.put("/:id", async (req, res) => {
  console.log("✏️ [PUT] /disponibilites/:id - Données reçues:", req.body);

  const { error } = disponibiliteSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { id } = req.params;
    const { jour, heure_debut, heure_fin, prof_id } = req.body;

    const { data, error } = await req.supabase
      .from("disponibilites")
      .update({ jour, heure_debut, heure_fin, prof_id })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json({ success: true, disponibilite: data[0] });
  } catch (err) {
    console.error("❌ Erreur mise à jour disponibilité:", err);
    res.status(500).json({ error: "Erreur mise à jour disponibilité", details: err.message });
  }
});

// ✅ Mettre à jour partiellement une disponibilité (PATCH)
router.patch("/:id", async (req, res) => {
  console.log("✏️ [PATCH] /disponibilites/:id - Données reçues:", req.body);

  const { error } = updateDisponibiliteSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { id } = req.params;
    const updateFields = req.body;

    const { data, error } = await req.supabase
      .from("disponibilites")
      .update(updateFields)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json({ success: true, disponibilite: data[0] });
  } catch (err) {
    console.error("❌ Erreur patch disponibilité:", err);
    res.status(500).json({ error: "Erreur mise à jour disponibilité", details: err.message });
  }
});

// ✅ Supprimer une disponibilité
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from("disponibilites")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Disponibilité supprimée" });
  } catch (err) {
    console.error("❌ Erreur suppression disponibilité:", err);
    res.status(500).json({ error: "Erreur suppression disponibilité", details: err.message });
  }
});

module.exports = router;
