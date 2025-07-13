// backend/routes/profRoutes.js - VERSION CORRIGÉE
const express = require("express");
const router = express.Router();
const { profSchema, profUpdateSchema } = require("../validators/profValidator");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../supabaseAdminClient");
const authenticateToken = require("../middleware/authenticateToken"); // 🆕 AJOUTÉ

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 🔄 Route GET /profs - MODIFIÉE pour retourner toutes les nouvelles colonnes
router.get("/", async (req, res) => {
  console.log("📡 Requête GET /profs (validés uniquement)");
  try {
    const { data, error } = await supabaseAdmin
      .from("profs")
      .select(`
        id, 
        nom, 
        bio,
        photo_url,
        video_intro_url,
        specialite,
        specialites,
        langues_parlees,
        prix_30min,
        prix_60min,
        experience_annees,
        pays_origine,
        certifications,
        disponible_maintenant,
        derniere_connexion,
        created_at,
        rating_moyen,
        nombre_avis
      `)
      .eq("is_validated", true)
      .order('derniere_connexion', { ascending: false });

    if (error) throw error;

    // 🆕 Enrichir les données pour le frontend
    const enrichedProfs = data.map(prof => ({
      ...prof,
      // Fallback pour compatibilité
      specialites: prof.specialites || (prof.specialite ? [prof.specialite] : ['Arabe général']),
      langues_parlees: prof.langues_parlees || ['Arabe'],
      prix_30min: prof.prix_30min || 15.00,
      experience_display: prof.experience_annees ? `${prof.experience_annees}+ ans` : '1+ an',
      // Statut en ligne basé sur dernière connexion (actif si connecté dans les 10 dernières minutes)
      is_online: prof.derniere_connexion ? 
        (new Date() - new Date(prof.derniere_connexion)) < 10 * 60 * 1000 : false
    }));

    res.json({ success: true, profs: enrichedProfs });
  } catch (e) {
    console.error("❌ Erreur récupération profs :", e.message);
    res.status(500).json({ error: "Erreur recuperation profs", details: e.message });
  }
});

// 🔄 Route POST / - MODIFIÉE pour supporter les nouvelles colonnes
router.post("/", authenticateToken, async (req, res) => {
  console.log("📝 Création ou mise à jour prof :", req.body);
  try {
    const { error: validationError } = profSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    // 🆕 Extraire toutes les nouvelles colonnes
    const { 
      nom, 
      specialite, 
      bio,
      photo_url,
      video_intro_url,
      specialites,
      langues_parlees,
      prix_30min,
      prix_60min,
      experience_annees,
      pays_origine,
      certifications,
      disponible_maintenant
    } = req.body;

    const { data: user } = await req.supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const { data: existing, error: selectError } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();
    if (selectError) throw selectError;

    // 🆕 Préparer les données à insérer/mettre à jour
    const profData = {
      nom,
      bio,
      specialite, // Garder pour compatibilité
      photo_url,
      video_intro_url,
      specialites: specialites || (specialite ? [specialite] : null),
      langues_parlees: langues_parlees || ['Arabe'],
      prix_30min: prix_30min || 15.00,
      prix_60min: prix_60min || (prix_30min ? prix_30min * 2 : 25.00),
      experience_annees: experience_annees || 1,
      pays_origine: pays_origine || 'Maroc',
      certifications,
      disponible_maintenant: disponible_maintenant || false,
      derniere_connexion: new Date().toISOString()
    };

    let result;
    if (existing) {
      // Mise à jour
      const { data, error } = await req.supabase
        .from("profs")
        .update(profData)
        .eq("id", existing.id)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      // Création
      const { data, error } = await req.supabase
        .from("profs")
        .insert([{ 
          ...profData, 
          created_by: userId, 
          is_validated: false 
        }])
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


// 🔧 Route GET /me - CORRIGÉE pour utiliser les données du middleware
router.get("/me", authenticateToken, async (req, res) => {
  console.log("👤 Requête GET /profs/me");
  try {
    // 🆕 Utiliser directement req.user du middleware
    const userId = req.user?.id;
    console.log("🔍 User ID du middleware:", userId);
    
    if (!userId) {
      console.log("❌ User ID manquant du middleware");
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    console.log("🔍 Recherche prof pour user ID:", userId);
    const { data, error } = await req.supabase
      .from("profs")
      .select("*")
      .eq("created_by", userId)
      .maybeSingle();
      
    console.log("🔍 Résultat recherche prof:", { data: data ? "TROUVÉ" : "VIDE", error });
    
    if (error) {
      console.log("❌ Erreur SQL:", error);
      throw error;
    }

    console.log("✅ Prof trouvé:", data ? "OUI" : "NON");
    res.json({ success: true, prof: data });
  } catch (e) {
    console.error("❌ Erreur récupération prof/me :", e.message);
    res.status(500).json({ error: "Erreur récupération profil prof", details: e.message });
  }
});



// 🆕 Nouvelle route PUT pour mise à jour partielle du profil
router.put("/me", authenticateToken, async (req, res) => {
  console.log("✏️ Mise à jour profil prof :", req.body);
  try {
    const { error: validationError } = profUpdateSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    const { data: user } = await req.supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    // Mettre à jour seulement les champs fournis
    const updateData = {
      ...req.body,
      derniere_connexion: new Date().toISOString()
    };

    const { data, error } = await req.supabase
      .from("profs")
      .update(updateData)
      .eq("created_by", userId)
      .select();

    if (error) throw error;

    res.json({ success: true, prof: data[0] });
  } catch (e) {
    console.error("❌ Erreur mise à jour profil prof :", e.message);
    res.status(500).json({ error: "Erreur mise à jour profil", details: e.message });
  }
});

// 🆕 Route pour mettre à jour le statut en ligne
router.patch("/me/online", authenticateToken, async (req, res) => {
  try {
    const { data: user } = await req.supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    const { data, error } = await req.supabase
      .from("profs")
      .update({ 
        disponible_maintenant: true,
        derniere_connexion: new Date().toISOString()
      })
      .eq("created_by", userId)
      .select("disponible_maintenant, derniere_connexion");

    if (error) throw error;

    res.json({ success: true, status: data[0] });
  } catch (e) {
    console.error("❌ Erreur mise à jour statut :", e.message);
    res.status(500).json({ error: "Erreur mise à jour statut", details: e.message });
  }
});

// Routes existantes avec authenticateToken
router.get("/all", authenticateToken, async (req, res) => {
  console.log("🔍 Requête GET /profs/all");
  try {
    const { data, error } = await req.supabase.from("profs").select("*");
    if (error) throw error;

    res.json({ success: true, profs: data });
  } catch (e) {
    console.error("❌ Erreur récupération profs admin :", e.message);
    res.status(500).json({ error: "Erreur recuperation profs admin", details: e.message });
  }
});

router.put("/:id/valider", authenticateToken, async (req, res) => {
  console.log("✅ Validation prof ID :", req.params.id);
  try {
    const { id } = req.params;
    const { error } = await req.supabase
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

module.exports = router;
