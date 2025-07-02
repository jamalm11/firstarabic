// backend/routes/reservationsRoutes.js
const express = require("express");
const router = express.Router();
const { createReservationSchema, updateReservationSchema } = require("../validators/reservationValidator");
const authenticateToken = require("../middleware/authenticateToken");
const supabaseAdmin = require("../supabaseAdminClient");

// 🔒 Middleware
router.use(authenticateToken);

// ✅ Créer une réservation
router.post("/", async (req, res) => {
  console.log("🆕 [POST] /reservations - Données reçues:", req.body);

  const { error } = createReservationSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { prof_id, date, heure_debut, heure_fin, statut } = req.body;

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .insert([{ prof_id, date, heure_debut, heure_fin, statut }])
      .select();

    if (error) throw error;

    res.json({ success: true, reservation: data[0] });
  } catch (err) {
    console.error("❌ Erreur création réservation:", err);
    res.status(500).json({ error: "Erreur création réservation", details: err.message });
  }
});

// ✅ Lire toutes les réservations
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase.from("reservations").select("*");
    if (error) throw error;
    res.json({ success: true, reservations: data });
  } catch (err) {
    console.error("❌ Erreur récupération réservations:", err);
    res.status(500).json({ error: "Erreur récupération réservations", details: err.message });
  }
});

// ✅ Lire une réservation par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, reservation: data });
  } catch (err) {
    console.error("❌ Erreur récupération réservation:", err);
    res.status(500).json({ error: "Erreur récupération réservation", details: err.message });
  }
});

// ✅ Modifier une réservation
router.put("/:id", async (req, res) => {
  console.log("✏️ [PUT] /reservations/:id - Données reçues:", req.body);

  const { error } = updateReservationSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from("reservations")
      .update(req.body)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json({ success: true, reservation: data[0] });
  } catch (err) {
    console.error("❌ Erreur mise à jour réservation:", err);
    res.status(500).json({ error: "Erreur mise à jour réservation", details: err.message });
  }
});

// ✅ Supprimer une réservation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase.from("reservations").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true, message: "Réservation supprimée" });
	  } catch (err) {
    console.error("❌ Erreur suppression réservation:", err);
    res.status(500).json({ error: "Erreur suppression réservation", details: err.message });
  }
});

module.exports = router;

