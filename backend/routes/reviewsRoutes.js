// backend/routes/reviewsRoutes.js - VERSION AVEC BYPASS TEMPORAIRE
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const Joi = require('joi');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const initSupabase = (req) =>
  createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: req.headers.authorization } },
  });

// Schéma de validation pour les reviews
const reviewSchema = Joi.object({
  cours_id: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  commentaire: Joi.string().allow('', null).max(1000).optional(),
  pedagogie_rating: Joi.alternatives().try(
    Joi.number().integer().min(1).max(5),
    Joi.number().valid(0),
    null
  ).optional(),
  communication_rating: Joi.alternatives().try(
    Joi.number().integer().min(1).max(5), 
    Joi.number().valid(0),
    null
  ).optional(),
  ponctualite_rating: Joi.alternatives().try(
    Joi.number().integer().min(1).max(5),
    Joi.number().valid(0), 
    null
  ).optional(),
  is_public: Joi.boolean().default(true)
});

// 📝 Créer une évaluation
router.post("/", async (req, res) => {
  console.log("🆕 [POST] /reviews - Création évaluation:", req.body);

  try {
    // Validation des données
    const { error: validationError } = reviewSchema.validate(req.body);
    if (validationError) {
      console.log("🚫 Erreur validation Joi:", validationError.details);
      return res.status(400).json({ 
        error: "Données invalides", 
        details: validationError.details[0].message,
        received_data: req.body
      });
    }

    console.log("✅ Validation Joi passée");

    const supabase = initSupabase(req);
    
    // Récupérer l'utilisateur connecté
    console.log("🔐 Récupération utilisateur...");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.log("❌ Erreur auth:", userError);
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const user_id = userData.user.id;
    console.log("✅ Utilisateur récupéré:", user_id);

    const { cours_id, rating, commentaire, pedagogie_rating, communication_rating, ponctualite_rating, is_public } = req.body;

    // 🆕 BYPASS TEMPORAIRE - Vérification simplifiée au lieu de can_review_cours
    console.log("🔍 Vérification simplifiée du cours...");
    
    // Récupérer les infos du cours directement
    const { data: coursData, error: coursError } = await supabase
      .from("cours")
      .select(`
        id,
        prof_id,
        eleve_id,
        statut,
        date,
        eleves!inner(created_by)
      `)
      .eq("id", cours_id)
      .eq("eleves.created_by", user_id)
      .single();

    if (coursError || !coursData) {
      console.log("❌ Cours non trouvé:", coursError);
      return res.status(404).json({ message: "Cours non trouvé ou non autorisé" });
    }

    console.log("✅ Cours trouvé:", coursData);

    // Vérifier que le cours est terminé (vérification basique)
    if (coursData.statut !== 'terminé') {
      console.log("❌ Cours pas terminé, statut:", coursData.statut);
      return res.status(403).json({ 
        message: "Ce cours n'est pas encore terminé et ne peut donc pas être évalué" 
      });
    }

    // Vérifier qu'il n'y a pas déjà un avis
    console.log("🔍 Vérification des avis existants...");
    const { data: existingReview, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("cours_id", cours_id)
      .eq("eleve_id", coursData.eleve_id)
      .maybeSingle();

    if (existingError) {
      console.log("❌ Erreur vérification avis existants:", existingError);
      return res.status(500).json({ message: "Erreur vérification des avis existants" });
    }

    if (existingReview) {
      console.log("❌ Avis déjà existant:", existingReview.id);
      return res.status(409).json({ 
        message: "Vous avez déjà évalué ce cours" 
      });
    }

    console.log("✅ Pas d'avis existant, création possible");

    // Créer l'évaluation
    console.log("💾 Insertion de l'évaluation...");
    const { data: reviewData, error: insertError } = await supabase
      .from("reviews")
      .insert([{
        cours_id,
        prof_id: coursData.prof_id,
        eleve_id: coursData.eleve_id,
        rating,
        commentaire: commentaire || null,
        pedagogie_rating: pedagogie_rating || null,
        communication_rating: communication_rating || null,
        ponctualite_rating: ponctualite_rating || null,
        is_public: is_public !== false,
        is_verified: true
      }])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erreur création review:", insertError);
      return res.status(500).json({ message: "Erreur création de l'évaluation" });
    }

    console.log("✅ Évaluation créée avec succès:", reviewData.id);
    res.status(201).json({ 
      success: true, 
      review: reviewData,
      message: "Évaluation créée avec succès" 
    });

  } catch (err) {
    console.error("❌ Erreur inattendue dans POST /reviews:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Récupérer les avis d'un professeur
router.get("/prof/:prof_id", async (req, res) => {
  console.log("🔍 [GET] /reviews/prof/:prof_id");

  try {
    const { prof_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const supabase = initSupabase(req);

    // Récupérer les avis publics avec infos enrichies
    const { data: reviews, error } = await supabase
      .from("reviews_publics")
      .select("*")
      .eq("prof_id", prof_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("❌ Erreur récupération reviews:", error);
      return res.status(500).json({ message: "Erreur récupération des avis" });
    }

    // Récupérer les stats du professeur
    const { data: profStats, error: statsError } = await supabase
      .from("profs")
      .select(`
        rating_moyen,
        nombre_avis,
        rating_pedagogie,
        rating_communication,
        rating_ponctualite
      `)
      .eq("id", prof_id)
      .single();

    if (statsError) {
      console.error("❌ Erreur stats prof:", statsError);
    }

    res.json({
      success: true,
      reviews,
      stats: profStats || {
        rating_moyen: 4.5,
        nombre_avis: 0,
        rating_pedagogie: null,
        rating_communication: null,
        rating_ponctualite: null
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: reviews && reviews.length === parseInt(limit)
      }
    });

  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Récupérer les cours qu'un élève peut évaluer
router.get("/can-review", async (req, res) => {
  console.log("🔍 [GET] /reviews/can-review");

  try {
    const supabase = initSupabase(req);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const user_id = userData.user.id;

    // Récupérer les cours terminés non encore évalués
    const { data: cours, error } = await supabase
      .from("cours")
      .select(`
        id,
        date,
        statut,
        profs!inner(id, nom, photo_url),
        eleves!inner(created_by)
      `)
      .eq("eleves.created_by", user_id)
      .in("statut", ["terminé", "fini"])
      .lt("date", new Date().toISOString());

    if (error) {
      console.error("❌ Erreur récupération cours:", error);
      return res.status(500).json({ message: "Erreur récupération des cours" });
    }

    // Filtrer ceux qui n'ont pas encore d'avis
    const { data: existingReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("cours_id")
      .in("cours_id", cours?.map(c => c.id) || []);

    if (reviewsError) {
      console.error("❌ Erreur récupération reviews existantes:", reviewsError);
    }

    const reviewedCoursIds = new Set(existingReviews?.map(r => r.cours_id) || []);
    const coursToReview = cours?.filter(c => !reviewedCoursIds.has(c.id)) || [];

    res.json({
      success: true,
      cours_to_review: coursToReview
    });

  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Récupérer les avis d'un élève - AJOUTEZ CETTE ROUTE
router.get("/my-reviews", async (req, res) => {
  console.log("🔍 [GET] /reviews/my-reviews");

  try {
    const supabase = initSupabase(req);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.log("❌ Erreur auth:", userError);
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const user_id = userData.user.id;
    console.log("✅ User ID:", user_id);

    // Récupérer l'élève connecté
    const { data: eleveData, error: eleveError } = await supabase
      .from("eleves")
      .select("id")
      .eq("created_by", user_id)
      .single();

    if (eleveError || !eleveData) {
      console.log("❌ Élève non trouvé:", eleveError);
      return res.status(404).json({ message: "Profil élève non trouvé" });
    }

    console.log("✅ Élève trouvé:", eleveData.id);

    // Récupérer les reviews de cet élève avec infos de base
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profs:prof_id(nom, photo_url),
        cours:cours_id(date)
      `)
      .eq("eleve_id", eleveData.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erreur récupération reviews:", error);
      return res.status(500).json({ message: "Erreur récupération de vos avis" });
    }

    console.log("✅ Reviews trouvées:", reviews?.length || 0);

    res.json({
      success: true,
      my_reviews: reviews || []
    });

  } catch (err) {
    console.error("❌ Erreur inattendue dans my-reviews:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
