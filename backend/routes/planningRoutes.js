// backend/routes/planningRoutes.js
const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// 📅 Récupérer tous les cours de l'utilisateur connecté
router.get("/", authenticateToken, async (req, res) => {
  try {
    const statut = req.query.statut || null;

    const { data, error } = await req.supabase
      .from("cours")
      .select(`
        id, date, statut, jitsi_url,
        profs (nom),
        eleves (nom)
      `)
      .eq("created_by", req.user.id);

    if (error) throw error;

    const planning = data
      .filter(c => !statut || c.statut === statut)
      .map(c => ({
        id: c.id,
        date: c.date,
        statut: c.statut,
        lien: c.jitsi_url,
        prof: c.profs?.nom || null,
        eleve: c.eleves?.nom || null
      }));

    res.json({ success: true, planning });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération planning", details: e.message });
  }
});

// 📅 Récupérer les créneaux réservés (cours confirmés)
router.get("/reserves", authenticateToken, async (req, res) => {
  try {
    const { prof_id } = req.query;
    if (!prof_id) return res.status(400).json({ error: "prof_id requis" });

    const { data, error } = await req.supabase
      .from("cours")
      .select("date")
      .eq("prof_id", prof_id)
      .eq("statut", "confirme");

    if (error) throw error;

    const dureeCoursMin = 30;
    const reserves = data.map(c => {
      const start = new Date(c.date);
      const end = new Date(start.getTime() + dureeCoursMin * 60000);
      return { start: start.toISOString(), end: end.toISOString() };
    });

    res.json({ success: true, reserves });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération créneaux réservés", details: e.message });
  }
});

// 📆 Récupérer les créneaux disponibles pour un prof
router.get("/disponibles", authenticateToken, async (req, res) => {
  try {
    const { prof_id } = req.query;
    if (!prof_id) return res.status(400).json({ error: "prof_id requis" });

    const { data: disponibilites, error: dispoError } = await req.supabase
      .from("disponibilites")
      .select("jour, heure_debut, heure_fin")
      .eq("prof_id", prof_id);
    if (dispoError) throw dispoError;

    const joursMap = {
      lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0
    };

    const dureeCoursMin = 30;
    const now = new Date();
    const prochainsCreneaux = [];

    for (const dispo of disponibilites) {
      const dayOffset = (7 + joursMap[dispo.jour.toLowerCase()] - now.getDay()) % 7;
      const dateCreneau = new Date(now);
      dateCreneau.setDate(now.getDate() + dayOffset);
      dateCreneau.setHours(0, 0, 0, 0);

      const [hStart, mStart] = dispo.heure_debut.split(":").map(Number);
      const [hEnd, mEnd] = dispo.heure_fin.split(":").map(Number);

      const start = new Date(dateCreneau);
      start.setHours(hStart, mStart, 0);

      const end = new Date(dateCreneau);
      end.setHours(hEnd, mEnd, 0);

      for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + dureeCoursMin)) {
        const creneauStart = new Date(t);
        const creneauEnd = new Date(t.getTime() + dureeCoursMin * 60000);
        prochainsCreneaux.push({ start: creneauStart.toISOString(), end: creneauEnd.toISOString() });
      }
    }

    const { data: reserves, error: reserveError } = await req.supabase
      .from("cours")
      .select("date")
      .eq("prof_id", prof_id)
      .eq("statut", "confirme");
    if (reserveError) throw reserveError;

    const reservesSet = new Set(reserves.map(r => new Date(r.date).toISOString()));
    const disponibles = prochainsCreneaux.filter(c => !reservesSet.has(c.start));

    res.json({ success: true, disponibles });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération disponibilités filtrées", details: e.message });
  }
});

module.exports = router;
