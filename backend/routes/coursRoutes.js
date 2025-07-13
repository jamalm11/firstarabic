// backend/routes/coursRoutes.js
const express = require("express");
const router = express.Router();
const { coursSchema } = require("../validators/coursValidator");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = require("../supabaseAdminClient");
const authenticateToken = require("../middleware/authenticateToken");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const initSupabase = (req) =>
  createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: req.headers.authorization } },
  });

// 📥 Créer un cours avec contrôle des disponibilités
router.post("/", async (req, res) => {
  console.log("\n🟢 [API] POST /cours appelée");
  console.log("📥 Données reçues dans le body:", JSON.stringify(req.body, null, 2));

  const { error: validationError } = coursSchema.validate(req.body);
  if (validationError) {
    console.log("🚫 [Validation] Erreur Joi:", validationError.details[0].message);
    return res.status(400).json({
      error: "Données invalides",
      details: validationError.details[0].message,
    });
  }

  const supabase = initSupabase(req);
  const { date, prof_id, eleve_id } = req.body;

  try {
    console.log("🔐 Tentative récupération utilisateur courant...");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.log("🚫 [Auth] Erreur récupération utilisateur:", userError?.message);
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const user_id = userData.user.id;
    console.log("✅ [Auth] Utilisateur authentifié ID:", user_id);

    console.log(`🔎 Vérification de l'élève ${eleve_id} appartenant à l'utilisateur...`);
    const { data: eleve, error: eleveError } = await supabase
      .from("eleves")
      .select("*")
      .eq("id", eleve_id)
      .eq("created_by", user_id)
      .single();

    if (eleveError || !eleve) {
      console.log("🚫 [Sécurité] Élève introuvable ou non autorisé:", eleveError?.message || "Aucun élève retourné");
      return res.status(403).json({ message: "Élève non autorisé ou inexistant" });
    }

    // 🆕 CONTRÔLE 1 : Vérifier que le cours n'existe pas déjà pour cet élève + prof + date
    console.log("🔍 [Contrôle 1] Vérification des doublons...");
    const coursDate = new Date(date);
    const { data: existingCours, error: existingError } = await supabase
      .from("cours")
      .select("*")
      .eq("prof_id", prof_id)
      .eq("eleve_id", eleve_id)
      .gte("date", coursDate.toISOString())
      .lt("date", new Date(coursDate.getTime() + 24 * 60 * 60 * 1000).toISOString()); // même jour

    if (existingError) {
      console.log("❌ [Contrôle 1] Erreur vérification doublons:", existingError.message);
      return res.status(500).json({ message: "Erreur vérification des cours existants" });
    }

    if (existingCours && existingCours.length > 0) {
      console.log("🚫 [Contrôle 1] Cours déjà réservé:", existingCours[0]);
      return res.status(409).json({ 
        message: "Un cours est déjà réservé avec ce professeur à cette date",
        existing_cours: existingCours[0]
      });
    }

    // 🆕 CONTRÔLE 2 : Vérifier que le créneau n'est pas déjà pris par un autre élève
    console.log("🔍 [Contrôle 2] Vérification des créneaux occupés...");
    const startTime = coursDate;
    const endTime = new Date(coursDate.getTime() + 30 * 60 * 1000); // Cours de 30min

    const { data: conflictingCours, error: conflictError } = await supabase
      .from("cours")
      .select("*")
      .eq("prof_id", prof_id)
      .gte("date", startTime.toISOString())
      .lt("date", endTime.toISOString())
      .neq("statut", "annulé");

    if (conflictError) {
      console.log("❌ [Contrôle 2] Erreur vérification conflits:", conflictError.message);
      return res.status(500).json({ message: "Erreur vérification des conflits" });
    }

    if (conflictingCours && conflictingCours.length > 0) {
      console.log("🚫 [Contrôle 2] Créneau déjà occupé:", conflictingCours[0]);
      return res.status(409).json({ 
        message: "Ce créneau est déjà réservé par un autre élève",
        conflicting_cours: conflictingCours[0]
      });
    }

    // 🆕 CONTRÔLE 3 : Vérifier que le prof est disponible à cette heure
    console.log("🔍 [Contrôle 3] Vérification des disponibilités du professeur...");
    
    // Extraire le jour de la semaine et l'heure
    const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const jourCours = joursSemaine[coursDate.getDay()];
    const heureCours = coursDate.getHours();
    const minutesCours = coursDate.getMinutes();
    const heureCoursString = `${heureCours.toString().padStart(2, '0')}:${minutesCours.toString().padStart(2, '0')}`;

    console.log(`📅 Cours demandé : ${jourCours} à ${heureCoursString}`);

    const { data: disponibilites, error: dispoError } = await supabase
      .from("disponibilites")
      .select("*")
      .eq("prof_id", prof_id)
      .eq("jour", jourCours);

    if (dispoError) {
      console.log("❌ [Contrôle 3] Erreur récupération disponibilités:", dispoError.message);
      return res.status(500).json({ message: "Erreur vérification des disponibilités" });
    }

    if (!disponibilites || disponibilites.length === 0) {
      console.log("🚫 [Contrôle 3] Aucune disponibilité pour ce jour:", jourCours);
      return res.status(400).json({ 
        message: `Le professeur n'est pas disponible le ${jourCours}`,
        jour_demande: jourCours
      });
    }

    // Vérifier si l'heure est dans un créneau de disponibilité
    let creneauValide = false;
    for (const dispo of disponibilites) {
      const [heureDebut, minuteDebut] = dispo.heure_debut.split(':').map(Number);
      const [heureFin, minuteFin] = dispo.heure_fin.split(':').map(Number);
      
      const minutesCoursTotal = heureCours * 60 + minutesCours;
      const minutesDebutTotal = heureDebut * 60 + minuteDebut;
      const minutesFinTotal = heureFin * 60 + minuteFin;
      
      console.log(`🕐 Dispo: ${dispo.heure_debut}-${dispo.heure_fin} (${minutesDebutTotal}-${minutesFinTotal}min), Cours: ${heureCoursString} (${minutesCoursTotal}min)`);
      
      if (minutesCoursTotal >= minutesDebutTotal && minutesCoursTotal + 30 <= minutesFinTotal) {
        creneauValide = true;
        console.log("✅ [Contrôle 3] Créneau valide trouvé:", dispo);
        break;
      }
    }

    if (!creneauValide) {
      console.log("🚫 [Contrôle 3] Aucun créneau de disponibilité valide");
      return res.status(400).json({ 
        message: `Le professeur n'est pas disponible à ${heureCoursString} le ${jourCours}`,
        disponibilites_du_jour: disponibilites.map(d => `${d.heure_debut}-${d.heure_fin}`)
      });
    }

    // 🔗 Génération du lien Jitsi
    const jitsiRoom = `firstarabic-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const lien_jitsi = `https://meet.jit.si/${jitsiRoom}`;
    console.log("🔗 Lien Jitsi généré :", lien_jitsi);

    console.log("✅ [Tous contrôles] Validés. Passage à l'insertion du cours...");
    console.log("📤 Données insérées:", { date, prof_id, eleve_id, lien_jitsi });

    const { data: newCours, error: insertError } = await supabase
      .from("cours")
      .insert([{ 
        date, 
        prof_id, 
        eleve_id, 
        jitsi_url: lien_jitsi,
        statut: 'prévu' // Statut par défaut
      }])
      .select()
      .single();

    if (insertError) {
      console.log("❌ [DB] Erreur insertion cours:", insertError.message);
      return res.status(500).json({ message: "Erreur création cours" });
    }

    console.log("✅ [Succès] Cours inséré avec succès ✅");
    return res.status(200).json({ 
      message: "Cours réservé avec succès", 
      cours: newCours,
      lien_jitsi 
    });
  } catch (err) {
    console.error("❌ [Exception] Erreur inattendue dans POST /cours:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Récupérer les cours d'un professeur
router.get("/", authenticateToken, async (req, res) => {
  console.log("🔍 [GET] /cours pour prof");
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Récupérer le prof connecté
    const { data: profData, error: profError } = await req.supabase
      .from("profs")
      .select("id")
      .eq("created_by", userId)
      .single();

    if (profError || !profData) {
      return res.status(404).json({ message: "Profil professeur non trouvé" });
    }

    // Récupérer les cours du prof avec infos élève
    const { data: cours, error } = await req.supabase
      .from("cours")
      .select(`
        *,
        eleves!inner(nom, email),
        profs!inner(nom)
      `)
      .eq("prof_id", profData.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Erreur récupération cours:", error);
      return res.status(500).json({ message: "Erreur récupération des cours" });
    }

    res.json({
      success: true,
      cours: cours || []
    });

  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
