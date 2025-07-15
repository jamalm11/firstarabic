// backend/routes/bookingRoutes.js - Routes pour le système de réservation - VERSION FINALE
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../supabaseAdminClient");
const authenticateToken = require("../middleware/authenticateToken");

// Validation schemas
const Joi = require('joi');

const availabilitySchema = Joi.object({
  jour: Joi.string().valid('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche').required(),
  heure_debut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  heure_fin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  is_active: Joi.boolean().default(true)
});

const reservationSchema = Joi.object({
  prof_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  heure_debut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  duree_minutes: Joi.number().valid(30, 60).default(30),
  message_eleve: Joi.string().max(500).allow('').optional()
});

// ========================================
// ROUTES POUR LES DISPONIBILITÉS
// ========================================

// 🔍 GET /availability/:profId - Voir les disponibilités d'un prof
router.get("/availability/:profId", async (req, res) => {
  console.log("🔍 Récupération disponibilités prof:", req.params.profId);
  try {
    const { profId } = req.params;
    const { date } = req.query; // Date optionnelle pour filtrer

    // Récupérer les disponibilités régulières
    let query = supabaseAdmin
      .from("disponibilites")
      .select("*")
      .eq("prof_id", profId)
      .eq("is_active", true)
      .order("jour");

    const { data: disponibilites, error: dispError } = await query;
    if (dispError) throw dispError;

    // Récupérer les exceptions si une date est fournie
    let exceptions = [];
    if (date) {
      const { data: exceptionsData, error: excError } = await supabaseAdmin
        .from("availability_exceptions")
        .select("*")
        .eq("prof_id", profId)
        .eq("exception_date", date);
      
      if (excError) throw excError;
      exceptions = exceptionsData || [];
    }

    // Récupérer les réservations existantes pour cette date si fournie
    let reservations = [];
    if (date) {
      const { data: reservationsData, error: resError } = await supabaseAdmin
        .from("reservations")
        .select("heure_debut, heure_fin, statut")
        .eq("prof_id", profId)
        .eq("date", date)
        .in("statut", ["en_attente", "confirmé"]);
      
      if (resError) throw resError;
      reservations = reservationsData || [];
    }

    console.log(`✅ ${disponibilites.length} créneaux trouvés pour le prof`);
    res.json({ 
      success: true, 
      disponibilites,
      exceptions,
      reservations,
      date_consultee: date
    });
  } catch (e) {
    console.error("❌ Erreur récupération disponibilités:", e.message);
    res.status(500).json({ error: "Erreur récupération disponibilités", details: e.message });
  }
});

// 📝 POST /availability - Créer une disponibilité (PROF uniquement)
router.post("/availability", authenticateToken, async (req, res) => {
  console.log("📝 Création disponibilité:", req.body);
  try {
    const { error: validationError } = availabilitySchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    // Récupérer l'ID du prof depuis le middleware
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    // Vérifier que l'utilisateur est bien un prof
    const { data: prof, error: profError } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .single();

    if (profError || !prof) {
      return res.status(403).json({ error: "Seuls les professeurs peuvent créer des disponibilités" });
    }

    const { jour, heure_debut, heure_fin, is_active } = req.body;

    // Vérifier que heure_fin > heure_debut
    if (heure_debut >= heure_fin) {
      return res.status(400).json({ error: "L'heure de fin doit être après l'heure de début" });
    }

    // Créer la disponibilité
    const { data, error } = await req.supabase
      .from("disponibilites")
      .insert([{
        prof_id: prof.id,
        jour,
        heure_debut,
        heure_fin,
        is_active: is_active !== false,
        created_by: userId
      }])
      .select();

    if (error) throw error;

    console.log("✅ Disponibilité créée:", data[0].id);
    res.json({ success: true, disponibilite: data[0] });
  } catch (e) {
    console.error("❌ Erreur création disponibilité:", e.message);
    res.status(500).json({ error: "Erreur création disponibilité", details: e.message });
  }
});

// 🔄 PUT /availability/:id - Modifier une disponibilité
router.put("/availability/:id", authenticateToken, async (req, res) => {
  console.log("🔄 Modification disponibilité:", req.params.id);
  try {
    const { error: validationError } = availabilitySchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    const { id } = req.params;
    const userId = req.user?.id;

    const { data, error } = await req.supabase
      .from("disponibilites")
      .update(req.body)
      .eq("id", id)
      .eq("created_by", userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Disponibilité non trouvée ou non autorisée" });
    }

    console.log("✅ Disponibilité modifiée");
    res.json({ success: true, disponibilite: data[0] });
  } catch (e) {
    console.error("❌ Erreur modification disponibilité:", e.message);
    res.status(500).json({ error: "Erreur modification disponibilité", details: e.message });
  }
});

// 🗑️ DELETE /availability/:id - Supprimer une disponibilité
router.delete("/availability/:id", authenticateToken, async (req, res) => {
  console.log("🗑️ Suppression disponibilité:", req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { error } = await req.supabase
      .from("disponibilites")
      .delete()
      .eq("id", id)
      .eq("created_by", userId);

    if (error) throw error;

    console.log("✅ Disponibilité supprimée");
    res.json({ success: true, message: "Disponibilité supprimée" });
  } catch (e) {
    console.error("❌ Erreur suppression disponibilité:", e.message);
    res.status(500).json({ error: "Erreur suppression disponibilité", details: e.message });
  }
});

// ========================================
// ROUTES POUR LES RÉSERVATIONS
// ========================================

// 📝 POST /reservations - Créer une demande de réservation (ÉLÈVE) - VERSION FINALE CORRIGÉE
router.post("/reservations", authenticateToken, async (req, res) => {
  console.log("📝 Création réservation:", req.body);
  try {
    const { error: validationError } = reservationSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const userMetadata = req.user?.user_metadata || {};
    
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    console.log("🔍 Recherche élève pour userId:", userId);

    // 🔧 CORRECTION : Vérifier si l'élève existe, sinon le créer automatiquement
    let { data: eleve, error: eleveError } = await req.supabase
      .from("eleves")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle(); // 🔧 Utiliser maybeSingle au lieu de single

    // 🆕 Si l'élève n'existe pas, le créer automatiquement
    if (!eleve) {
      console.log("🆕 Élève non trouvé, création automatique...");
      
      // Extraire le nom depuis les métadonnées ou l'email
      const nom = userMetadata.full_name || 
                 userMetadata.name || 
                 userEmail?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, ' ') || 
                 'Élève';

      const { data: newEleve, error: createError } = await req.supabase
        .from("eleves")
        .insert([{
          nom: nom,
          email: userEmail,
          created_by: userId,
          niveau_arabe: 'débutant',
          date_inscription: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error("❌ Erreur création élève:", createError);
        return res.status(500).json({ error: "Erreur création profil élève", details: createError.message });
      }

      eleve = newEleve;
      console.log("✅ Élève créé automatiquement:", eleve.id);
    } else {
      console.log("✅ Élève existant trouvé:", eleve.id);
    }

    const { prof_id, date, heure_debut, duree_minutes, message_eleve } = req.body;

    // Calculer l'heure de fin
    const heure_fin = new Date(`1970-01-01T${heure_debut}:00Z`);
    heure_fin.setMinutes(heure_fin.getMinutes() + (duree_minutes || 30));
    const heure_fin_str = heure_fin.toISOString().slice(11, 16);

    // 🆕 CORRECTION COMPLÈTE : Vérifier les dates ET heures passées
    const dateReservation = new Date(date);
    const maintenant = new Date();
    
    // Vérifier que la date n'est pas dans le passé
    if (dateReservation < maintenant.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: "Impossible de réserver dans le passé" });
    }
    
    // 🆕 NOUVEAU : Si c'est aujourd'hui, vérifier que l'heure n'est pas passée
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const dateReservationJour = new Date(dateReservation);
    dateReservationJour.setHours(0, 0, 0, 0);
    
    if (dateReservationJour.getTime() === aujourdhui.getTime()) {
      // C'est aujourd'hui, vérifier l'heure
      const [heures, minutes] = heure_debut.split(':').map(Number);
      const heureReservation = new Date();
      heureReservation.setHours(heures, minutes, 0, 0);
      
      const maintenant30min = new Date(Date.now() + (30 * 60 * 1000)); // +30 minutes
      
      if (heureReservation <= maintenant30min) {
        console.log(`❌ Créneau ${heure_debut} refusé - trop proche ou passé (maintenant: ${new Date().toTimeString().slice(0,5)})`);
        return res.status(400).json({ 
          error: "Impossible de réserver à une heure passée ou trop proche (minimum 30 minutes à l'avance)",
          heure_demandee: heure_debut,
          heure_minimale: maintenant30min.toTimeString().slice(0,5)
        });
      }
      
      console.log(`✅ Créneau ${heure_debut} accepté (maintenant: ${new Date().toTimeString().slice(0,5)}, minimum: ${maintenant30min.toTimeString().slice(0,5)})`);
    }

    // Vérifier la disponibilité du prof
    const { data: checkResult } = await req.supabase.rpc('is_prof_available', {
      p_prof_id: prof_id,
      p_date: date,
      p_start_time: heure_debut,
      p_duration_minutes: duree_minutes || 30
    });

    if (!checkResult) {
      return res.status(400).json({ error: "Le professeur n'est pas disponible à ce créneau" });
    }

    // Vérifier les conflits
    const { data: conflictResult } = await req.supabase.rpc('check_booking_conflict', {
      p_prof_id: prof_id,
      p_date: date,
      p_start_time: heure_debut,
      p_duration_minutes: duree_minutes || 30
    });

    if (!conflictResult) {
      return res.status(400).json({ error: "Ce créneau est déjà réservé" });
    }

    // Récupérer les prix du prof
    const { data: prof, error: profError } = await req.supabase
      .from("profs")
      .select("prix_30min, prix_60min")
      .eq("id", prof_id)
      .single();

    if (profError) throw profError;

    const prix_total = duree_minutes === 60 
      ? (prof.prix_60min || prof.prix_30min * 2) 
      : prof.prix_30min;

    // Créer la réservation
    const { data, error } = await req.supabase
      .from("reservations")
      .insert([{
        eleve_id: eleve.id,
        prof_id,
        date,
        heure_debut,
        heure_fin: heure_fin_str,
        duree_minutes: duree_minutes || 30,
        prix_total,
        message_eleve,
        statut: 'en_attente'
      }])
      .select();

    if (error) throw error;

    // Créer une notification pour le prof
    await req.supabase
      .from("notifications")
      .insert([{
        message: `Nouvelle demande de réservation pour le ${date} à ${heure_debut}`,
        type: 'nouvelle_demande',
        title: 'Nouvelle demande de cours',
        related_id: data[0].id,
        user_type: 'prof',
        created_by: userId
      }]);

    console.log("✅ Réservation créée:", data[0].id);
    res.json({ success: true, reservation: data[0] });
  } catch (e) {
    console.error("❌ Erreur création réservation:", e.message);
    res.status(500).json({ error: "Erreur création réservation", details: e.message });
  }
});

// 🔍 GET /reservations/me - Voir ses réservations
router.get("/reservations/me", authenticateToken, async (req, res) => {
  console.log("🔍 Récupération réservations utilisateur");
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Utilisateur non authentifié" });

    // Vérifier si c'est un prof ou un élève
    const { data: prof } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();

    const { data: eleve } = await req.supabase
      .from("eleves")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();

    let query = req.supabase
      .from("reservations")
      .select(`
        *,
        profs:prof_id(nom, photo_url),
        eleves:eleve_id(nom, prenom)
      `)
      .order('date', { ascending: true });

    if (prof) {
      query = query.eq('prof_id', prof.id);
    } else if (eleve) {
      query = query.eq('eleve_id', eleve.id);
    } else {
      return res.status(403).json({ error: "Utilisateur non autorisé" });
    }

    const { data, error } = await query;
    if (error) throw error;

    console.log(`✅ ${data.length} réservations trouvées`);
    res.json({ success: true, reservations: data, user_type: prof ? 'prof' : 'eleve' });
  } catch (e) {
    console.error("❌ Erreur récupération réservations:", e.message);
    res.status(500).json({ error: "Erreur récupération réservations", details: e.message });
  }
});

// ✅ PUT /reservations/:id/confirm - Confirmer une réservation (PROF)
router.put("/reservations/:id/confirm", authenticateToken, async (req, res) => {
  console.log("✅ Confirmation réservation:", req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Vérifier que c'est bien le prof concerné
    const { data: prof } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .single();

    if (!prof) {
      return res.status(403).json({ error: "Seuls les professeurs peuvent confirmer des réservations" });
    }

    // Confirmer la réservation (le trigger créera automatiquement le cours)
    const { data, error } = await req.supabase
      .from("reservations")
      .update({ 
        statut: 'confirmé',
        confirmed_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("prof_id", prof.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    console.log("✅ Réservation confirmée");
    res.json({ success: true, reservation: data[0] });
  } catch (e) {
    console.error("❌ Erreur confirmation réservation:", e.message);
    res.status(500).json({ error: "Erreur confirmation réservation", details: e.message });
  }
});

// ❌ PUT /reservations/:id/refuse - Refuser une réservation (PROF)
router.put("/reservations/:id/refuse", authenticateToken, async (req, res) => {
  console.log("❌ Refus réservation:", req.params.id);
  try {
    const { id } = req.params;
    const { motif_refus } = req.body;
    const userId = req.user?.id;

    // Vérifier que c'est bien le prof concerné
    const { data: prof } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .single();

    if (!prof) {
      return res.status(403).json({ error: "Seuls les professeurs peuvent refuser des réservations" });
    }

    const { data, error } = await req.supabase
      .from("reservations")
      .update({ 
        statut: 'refusé',
        motif_refus
      })
      .eq("id", id)
      .eq("prof_id", prof.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    console.log("✅ Réservation refusée");
    res.json({ success: true, reservation: data[0] });
  } catch (e) {
    console.error("❌ Erreur refus réservation:", e.message);
    res.status(500).json({ error: "Erreur refus réservation", details: e.message });
  }
});

// 🗑️ DELETE /reservations/:id - Annuler une réservation
router.delete("/reservations/:id", authenticateToken, async (req, res) => {
  console.log("🗑️ Annulation réservation:", req.params.id);
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Récupérer la réservation pour vérifier les droits
    const { data: reservation, error: resError } = await req.supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (resError) throw resError;

    // Vérifier les droits (élève propriétaire ou prof concerné)
    const { data: eleve } = await req.supabase
      .from("eleves")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();

    const { data: prof } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .maybeSingle();

    const isAuthorized = (eleve && reservation.eleve_id === eleve.id) || 
                        (prof && reservation.prof_id === prof.id);

    if (!isAuthorized) {
      return res.status(403).json({ error: "Non autorisé à annuler cette réservation" });
    }

    // Annuler la réservation
    const { error } = await req.supabase
      .from("reservations")
      .update({ statut: 'annulé' })
      .eq("id", id);

    if (error) throw error;

    console.log("✅ Réservation annulée");
    res.json({ success: true, message: "Réservation annulée" });
  } catch (e) {
    console.error("❌ Erreur annulation réservation:", e.message);
    res.status(500).json({ error: "Erreur annulation réservation", details: e.message });
  }
});

// ========================================
// ROUTES UTILITAIRES
// ========================================

// 🔍 GET /availability/slots/:profId/:date - Créneaux disponibles pour une date - VERSION CORRIGÉE
router.get("/availability/slots/:profId/:date", async (req, res) => {
  console.log("🔍 Créneaux disponibles pour:", req.params);
  try {
    const { profId, date } = req.params;
    const { duree } = req.query; // durée en minutes (30 ou 60)
    const dureeDemandee = parseInt(duree) || 30;

    // 🆕 Vérifier si la date est dans le passé
    const dateObj = new Date(date);
    const maintenant = new Date();
    const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const dateReservation = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (dateReservation < aujourdhui) {
      console.log("❌ Date dans le passé, aucun créneau disponible");
      return res.json({ 
        success: true, 
        creneaux: [],
        date,
        duree_minutes: dureeDemandee,
        message: "Aucun créneau disponible pour une date passée"
      });
    }

    // Récupérer le jour de la semaine
    const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const nomJour = joursSemaine[dateObj.getDay()];

    // Récupérer les disponibilités pour ce jour
    const { data: disponibilites, error } = await supabaseAdmin
      .from("disponibilites")
      .select("heure_debut, heure_fin")
      .eq("prof_id", profId)
      .eq("jour", nomJour)
      .eq("is_active", true);

    if (error) throw error;

    // Récupérer les réservations existantes pour cette date
    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("heure_debut, heure_fin")
      .eq("prof_id", profId)
      .eq("date", date)
      .in("statut", ["en_attente", "confirmé"]);

    // 🆕 Calculer l'heure minimale (maintenant + 30 minutes si c'est aujourd'hui)
    let heureMinimale = null;
    const estAujourdhui = dateReservation.getTime() === aujourdhui.getTime();
    
    if (estAujourdhui) {
      // Si c'est aujourd'hui, heure minimale = maintenant + 30 minutes
      const maintenant30min = new Date(maintenant.getTime() + (30 * 60 * 1000));
      heureMinimale = maintenant30min.toTimeString().slice(0, 5); // Format HH:MM
      console.log(`📅 Réservation pour aujourd'hui, heure minimale: ${heureMinimale}`);
    }

    // Générer les créneaux disponibles
    const creneauxDisponibles = [];
    
    for (const dispo of disponibilites) {
      const debut = new Date(`1970-01-01T${dispo.heure_debut}:00Z`);
      const fin = new Date(`1970-01-01T${dispo.heure_fin}:00Z`);
      
      // Générer des créneaux de 30 minutes
      const current = new Date(debut);
      while (current.getTime() + (dureeDemandee * 60 * 1000) <= fin.getTime()) {
        const creneauDebut = current.toISOString().slice(11, 16);
        const creneauFin = new Date(current.getTime() + (dureeDemandee * 60 * 1000)).toISOString().slice(11, 16);
        
        // 🆕 Vérifier si le créneau n'est pas dans le passé (pour aujourd'hui)
        let creneauValide = true;
        if (estAujourdhui && heureMinimale && creneauDebut < heureMinimale) {
          creneauValide = false;
          console.log(`⏰ Créneau ${creneauDebut} ignoré (passé ou trop proche)`);
        }
        
        // Vérifier si ce créneau n'est pas déjà réservé
        const estReserve = reservations?.some(res => {
          return (creneauDebut < res.heure_fin && creneauFin > res.heure_debut);
        });

        if (creneauValide && !estReserve) {
          creneauxDisponibles.push({
            heure_debut: creneauDebut,
            heure_fin: creneauFin,
            duree_minutes: dureeDemandee
          });
        }

        current.setMinutes(current.getMinutes() + 30); // Avancer par pas de 30 min
      }
    }

    console.log(`✅ ${creneauxDisponibles.length} créneaux disponibles trouvés`);
    res.json({ 
      success: true, 
      creneaux: creneauxDisponibles,
      date,
      duree_minutes: dureeDemandee,
      est_aujourdhui: estAujourdhui,
      heure_minimale: heureMinimale
    });
  } catch (e) {
    console.error("❌ Erreur récupération créneaux:", e.message);
    res.status(500).json({ error: "Erreur récupération créneaux", details: e.message });
  }
});

module.exports = router;
