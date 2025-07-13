// backend/routes/profRoutes.js - VERSION CORRIGÉE avec req.user
const express = require("express");
const router = express.Router();
const { profSchema, profUpdateSchema } = require("../validators/profValidator");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../supabaseAdminClient");
const authenticateToken = require("../middleware/authenticateToken");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 🔄 Route GET /profs - VERSION OPTIMISÉE avec profs_publics
router.get("/", async (req, res) => {
  console.log("📡 Requête GET /profs (depuis profs_publics)");
  try {
    // 🆕 Utilisation de la vue profs_publics au lieu de la table profs
    const { data, error } = await supabaseAdmin
      .from("profs_publics")  // 🎯 Vue optimisée (déjà filtrée et enrichie)
      .select(`
        id, 
        nom, 
        bio,
        photo_url,
        video_intro_url,
        specialites,
        langues_parlees,
        prix_30min,
        prix_60min,
        prix_60min_calcule,
        experience_annees,
        pays_origine,
        certifications,
        disponible_maintenant,
        derniere_connexion,
        created_at,
        score_profil,
        rating_moyen,
        nombre_avis,
        rating_pedagogie,
        rating_communication,
        rating_ponctualite
      `)
      .order('score_profil', { ascending: false }); // 🆕 Tri par qualité du profil

    if (error) throw error;

    // 🆕 Enrichir les données pour le frontend
    const enrichedProfs = data.map(prof => ({
      ...prof,
      // Fallback pour compatibilité avec l'ancien code
      specialite: prof.specialites?.[0] || 'Arabe général',
      specialites: prof.specialites || ['Arabe général'],
      langues_parlees: prof.langues_parlees || ['Arabe'],
      prix_30min: prof.prix_30min || 15.00,
      prix_60min: prof.prix_60min_calcule || prof.prix_60min || 25.00,
      experience_display: prof.experience_annees ? `${prof.experience_annees}+ ans` : '1+ an',
      
      // 🆕 Statut en ligne basé sur dernière connexion (actif si connecté dans les 10 dernières minutes)
      is_online: prof.derniere_connexion ? 
        (new Date() - new Date(prof.derniere_connexion)) < 10 * 60 * 1000 : false,
      
      // 🆕 Badge qualité basé sur le score de profil
      quality_badge: prof.score_profil >= 80 ? 'premium' : 
                    prof.score_profil >= 60 ? 'verified' : 
                    prof.score_profil >= 40 ? 'standard' : 'basic',
      
      // 🆕 Indicateur de complétude du profil
      profile_completeness: Math.round((prof.score_profil / 100) * 100)
    }));

    console.log(`✅ ${enrichedProfs.length} professeurs récupérés depuis profs_publics`);
    res.json({ success: true, profs: enrichedProfs });
  } catch (e) {
    console.error("❌ Erreur récupération profs :", e.message);
    res.status(500).json({ error: "Erreur recuperation profs", details: e.message });
  }
});

// 🔄 Route POST / - VERSION CORRIGÉE avec req.user
router.post("/", authenticateToken, async (req, res) => {
  console.log("📝 Création ou mise à jour prof :", req.body);
  try {
    // 🔧 DEBUG: Validation Joi
    console.log("🔧 Début validation Joi...");
    const { error: validationError } = profSchema.validate(req.body);
    if (validationError) {
      console.log("❌ Erreur validation Joi:", validationError.details[0].message);
      return res.status(400).json({ error: validationError.details[0].message });
    }
    console.log("✅ Validation Joi réussie");

    // 🔧 DEBUG: Extraction des données
    console.log("🔧 Extraction des données du body...");
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
    console.log("✅ Données extraites:", { nom, specialite, bio, prix_30min });

    // 🔧 DEBUG: Récupération utilisateur - VERSION CORRIGÉE
    console.log("🔧 Récupération utilisateur depuis le middleware...");
    const userId = req.user?.id; // 🆕 CORRECTION: Utiliser req.user au lieu de req.supabase
    console.log("🔍 User ID récupéré:", userId);
    
    if (!userId) {
      console.log("❌ User ID manquant");
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    console.log("✅ Utilisateur trouvé, ID:", userId);

    // 🔧 DEBUG: Vérification existence prof
    console.log("🔧 Vérification existence prof en base...");
    const { data: existing, error: selectError } = await req.supabase
      .from("profs")  // 🎯 Toujours utiliser la table pour les modifications
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();
    
    console.log("🔍 Résultat vérification existence:", { 
      existing: existing ? "TROUVÉ" : "VIDE", 
      error: selectError ? selectError.message : "NULL" 
    });
    
    if (selectError) {
      console.log("❌ Erreur lors de la vérification existence:", selectError);
      throw selectError;
    }

    // 🔧 DEBUG: Préparation des données
    console.log("🔧 Préparation des données prof...");
    const profData = {
      nom,
      bio,
      specialite, // Garder pour compatibilité
      photo_url,
      video_intro_url,
      specialites: specialites || (specialite ? [specialite] : ['Arabe général']),
      langues_parlees: langues_parlees || ['Arabe'],
      prix_30min: prix_30min || 15.00,
      prix_60min: prix_60min || (prix_30min ? prix_30min * 2 : 25.00),
      experience_annees: experience_annees || 1,
      pays_origine: pays_origine || 'Maroc',
      certifications: certifications || [],
      disponible_maintenant: disponible_maintenant || false,
      derniere_connexion: new Date().toISOString()
    };
    console.log("✅ Données prof préparées:", profData);

    let result;
    if (existing) {
      // 🔧 DEBUG: Mise à jour
      console.log("🔄 Mise à jour prof existant:", existing.id);
      console.log("🔧 Tentative de mise à jour en base...");
      
      const { data, error } = await req.supabase
        .from("profs")
        .update(profData)
        .eq("id", existing.id)
        .select();
      
      console.log("📊 Résultat mise à jour:", { 
        data: data ? "SUCCESS" : "NULL", 
        error: error ? error.message : "NULL" 
      });
      
      if (error) {
        console.log("❌ Erreur Supabase mise à jour complète:", error);
        throw error;
      }
      result = data[0];
      console.log("✅ Mise à jour réussie, prof ID:", result.id);
      
    } else {
      // 🔧 DEBUG: Création
      console.log("🆕 Création nouveau prof");
      console.log("🔧 Tentative d'insertion en base...");
      
      const insertData = { 
        ...profData, 
        created_by: userId, 
        is_validated: false // Nécessite validation admin
      };
      console.log("🔧 Données complètes à insérer:", insertData);
      
      const { data, error } = await req.supabase
        .from("profs")
        .insert([insertData])
        .select();
      
      console.log("📊 Résultat insertion:", { 
        data: data ? "SUCCESS" : "NULL", 
        error: error ? error.message : "NULL" 
      });
      
      if (error) {
        console.log("❌ Erreur Supabase insertion complète:", error);
        console.log("❌ Détails erreur Supabase:", {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
        throw error;
      }
      result = data[0];
      console.log("✅ Insertion réussie, nouveau prof ID:", result.id);
    }

    console.log("✅ Prof enregistré avec succès:", result.id);
    console.log("🎉 Envoi réponse succès au client");
    res.json({ success: true, prof: result });
    
  } catch (e) {
    console.error("❌ Erreur GLOBALE création/mise à jour prof:", e.message);
    console.error("❌ Stack trace complète:", e.stack);
    console.error("❌ Erreur détaillée:", e);
    res.status(500).json({ error: "Erreur enregistrement prof", details: e.message });
  }
});

// 🔧 Route GET /me - CORRIGÉE pour utiliser les données du middleware
router.get("/me", authenticateToken, async (req, res) => {
  console.log("👤 Requête GET /profs/me");
  try {
    const userId = req.user?.id;
    console.log("🔍 User ID du middleware:", userId);
    
    if (!userId) {
      console.log("❌ User ID manquant du middleware");
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    console.log("🔍 Recherche prof pour user ID:", userId);
    // 🎯 Utiliser la table profs pour /me (données complètes)
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

// 🆕 Nouvelle route PUT pour mise à jour partielle du profil - CORRIGÉE
router.put("/me", authenticateToken, async (req, res) => {
  console.log("✏️ Mise à jour profil prof :", req.body);
  try {
    const { error: validationError } = profUpdateSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    // 🆕 CORRECTION: Utiliser req.user au lieu de req.supabase.auth.getUser()
    const userId = req.user?.id;
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

    console.log("✅ Profil prof mis à jour");
    res.json({ success: true, prof: data[0] });
  } catch (e) {
    console.error("❌ Erreur mise à jour profil prof :", e.message);
    res.status(500).json({ error: "Erreur mise à jour profil", details: e.message });
  }
});

// 🆕 Route pour mettre à jour le statut en ligne - CORRIGÉE
router.patch("/me/online", authenticateToken, async (req, res) => {
  try {
    // 🆕 CORRECTION: Utiliser req.user au lieu de req.supabase.auth.getUser()
    const userId = req.user?.id;
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

    console.log("✅ Statut en ligne mis à jour");
    res.json({ success: true, status: data[0] });
  } catch (e) {
    console.error("❌ Erreur mise à jour statut :", e.message);
    res.status(500).json({ error: "Erreur mise à jour statut", details: e.message });
  }
});

// 🔍 Route GET /all - Pour admin (utilise la table complète)
router.get("/all", authenticateToken, async (req, res) => {
  console.log("🔍 Requête GET /profs/all (admin)");
  try {
    // 🎯 Admin a besoin de voir TOUS les profs (validés et non-validés)
    const { data, error } = await req.supabase
      .from("profs")  // Table complète, pas la vue
      .select("*")
      .order('created_at', { ascending: false });
    if (error) throw error;

    console.log(`✅ ${data.length} professeurs récupérés (admin)`);
    res.json({ success: true, profs: data });
  } catch (e) {
    console.error("❌ Erreur récupération profs admin :", e.message);
    res.status(500).json({ error: "Erreur recuperation profs admin", details: e.message });
  }
});

// ✅ Route PUT pour validation admin
router.put("/:id/valider", authenticateToken, async (req, res) => {
  console.log("✅ Validation prof ID :", req.params.id);
  try {
    const { id } = req.params;
    
    // 🎯 Validation = utiliser la table profs
    const { error } = await req.supabase
      .from("profs")
      .update({ 
        is_validated: true,
        derniere_connexion: new Date().toISOString()
      })
      .eq("id", id);
    if (error) throw error;

    console.log("✅ Professeur validé avec succès");
    res.json({ success: true, message: "Professeur validé" });
  } catch (e) {
    console.error("❌ Erreur validation prof :", e.message);
    res.status(500).json({ error: "Erreur validation prof", details: e.message });
  }
});

// 🆕 Route GET /stats - Statistiques des professeurs
router.get("/stats", async (req, res) => {
  console.log("📊 Requête GET /profs/stats");
  try {
    // Utiliser profs_publics pour les stats publiques
    const { data, error } = await supabaseAdmin
      .from("profs_publics")
      .select("score_profil, rating_moyen, nombre_avis, experience_annees");
    
    if (error) throw error;

    const stats = {
      total_profs: data.length,
      moyenne_score_profil: Math.round(data.reduce((acc, p) => acc + (p.score_profil || 0), 0) / data.length),
      moyenne_rating: parseFloat((data.reduce((acc, p) => acc + (p.rating_moyen || 0), 0) / data.length).toFixed(1)),
      total_avis: data.reduce((acc, p) => acc + (p.nombre_avis || 0), 0),
      moyenne_experience: Math.round(data.reduce((acc, p) => acc + (p.experience_annees || 0), 0) / data.length),
      profs_premium: data.filter(p => (p.score_profil || 0) >= 80).length,
      profs_excellents: data.filter(p => (p.rating_moyen || 0) >= 4.5).length
    };

    console.log("✅ Statistiques calculées:", stats);
    res.json({ success: true, stats });
  } catch (e) {
    console.error("❌ Erreur calcul statistiques :", e.message);
    res.status(500).json({ error: "Erreur calcul statistiques", details: e.message });
  }
});

module.exports = router;
