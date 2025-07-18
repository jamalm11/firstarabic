
// ========= IMPORTS =========

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');

const abonnementController = require('./controllers/abonnementController');
const paiementController = require('./controllers/paiementController');
const reservationsController = require('./controllers/reservationsController');
const notificationsController = require('./controllers/notificationsController');
const disponibilitesController = require('./controllers/disponibilitesController');
const { eleveSchema } = require('./validators/eleveValidator');
const { coursSchema } = require('./validators/coursValidator');
const { profSchema } = require('./validators/profValidator');
const { sendEmail } = require('./utils/email');
const ensureProfile = require('./middleware/ensureProfile');
const supabaseAdmin = require("./supabaseAdminClient");
const rateLimit = require("express-rate-limit");
// ========= APP SETUP =========

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ========= SUPABASE CLIENT =========

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});


// ========= MIDDLEWARES =========
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    req.supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });

    const { data: { user }, error } = await req.supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Token invalide" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Erreur d'authentification" });
  }
};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
   


// ========== ROUTES ===================================

app.get('/', (req, res) => {
  res.json({ status: "API FirstArabic operationnelle !" });
});

// === ELEVE ===
app.post('/eleve', authenticateToken, async (req, res) => {
  try {
    
//    const { nom } = req.body;
//    if (!nom) return res.status(400).json({ error: "Nom requis" });
    
    const { error: validationError } = eleveSchema.validate(req.body);
    if (validationError) {
     return res.status(400).json({ error: "Données invalides", details: validationError.details[0].message });
    }
    const { nom } = req.body;
   
    const { data, error } = await req.supabase.from('eleves').insert([{ nom, created_by: req.user.id }]).select();
    if (error) throw error;
    res.json({ success: true, eleve: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur creation eleve", details: e.message });
  }
});

app.get('/eleves', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('eleves').select('*').eq('created_by', req.user.id);
    if (error) throw error;
    res.json({ success: true, eleves: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur recuperation eleves", details: e.message });
  }
});

//  NOUVELLES ROUTES ELEVE
app.get('/eleve/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from('eleves')
      .select('*')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .maybeSingle();
    if (error) throw error;
    res.json({ success: true, eleve: data });
  } catch (e) {
    res.status(404).json({ error: "eleve non trouve", details: e.message });
  }
});

app.put('/eleve/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: "Nom requis" });
    const { data, error } = await req.supabase
      .from('eleves')
      .update({ nom })
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select();
    if (error) throw error;
    res.json({ success: true, eleve: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur mise a jour eleve", details: e.message });
  }
});

app.delete('/eleve/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('eleves')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: "eleve supprime" });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression eleve", details: e.message });
  }
});

// Récupérer les cours d’un élève pour une date spécifique
app.get('/cours/eleve/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date requise au format YYYY-MM-DD" });

    const { data, error } = await req.supabase
      .from('cours')
      .select(`
        id, date, statut,
        profs (nom),
        eleves (nom)
      `)
      .eq('eleve_id', id)
      .gte('date', `${date}T00:00:00`)
      .lt('date', `${date}T23:59:59`)
      .order('date', { ascending: true });

    if (error) throw error;

    res.json({ success: true, cours: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération cours élève", details: e.message });
  }
});


// === PROF ===
// 🔒 Route admin : récupérer tous les profs, validés ou non
app.get('/profs/all', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('profs').select('*');
    if (error) throw error;
    res.json({ success: true, profs: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur recuperation profs admin", details: e.message });
  }
});

// ✅ Route admin : valider un prof
app.put('/prof/:id/valider', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('profs')
      .update({ is_validated: true })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: "Professeur validé" });
  } catch (e) {
    res.status(500).json({ error: "Erreur validation prof", details: e.message });
  }
});


app.post('/prof', authenticateToken, async (req, res) => {
  try {
    const { error: validationError } = profSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    const { nom, specialite, bio } = req.body;
    const { data: existing, error: selectError } = await req.supabase.from('profs').select('id').eq('created_by', req.user.id).maybeSingle();
    if (selectError) throw selectError;

    let result;
    if (existing) {
      const { data, error } = await req.supabase.from('profs').update({ nom, specialite, bio }).eq('id', existing.id).select();
      if (error) throw error;
      result = data[0];
    } else {
      const { data, error } = await req.supabase.from('profs').insert([{ nom, specialite, bio, created_by: req.user.id, is_validated: false }]).select();
      if (error) throw error;
      result = data[0];
    }
    res.json({ success: true, prof: result });
  } catch (e) {
    res.status(500).json({ error: "Erreur enregistrement prof", details: e.message });
  }
});

app.get('/profs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profs').select('id, nom, specialite, bio').eq('is_validated', true);
    if (error) throw error;
    res.json({ success: true, profs: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur recuperation profs", details: e.message });
  }
});

app.get('/prof/me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('profs').select('*').eq('created_by', req.user.id).maybeSingle();
    if (error) throw error;
    res.json({ success: true, prof: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur recuperation profil prof", details: e.message });
  }
});


// ✅ Route corrigée : /profs-disponibles

app.get("/profs-disponibles", authenticateToken, async (req, res) => {
  // Debug: Log des headers et params initiaux
  console.log("\n=== NOUVELLE REQUÊTE ===");
  console.log("Headers:", {
    authorization: req.headers.authorization?.slice(0, 20) + '...',
    'content-type': req.headers['content-type']
  });
  console.log("Query Params:", req.query);

  try {
    const { date, period } = req.query;

    // Debug: Validation des paramètres
    if (!date || !period) {
      console.error("❌ Paramètres manquants:", { date, period });
      return res.status(400).json({ error: "Date et période requises" });
    }

    const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const dateObj = new Date(date);
    
    // Debug: Vérification du parsing de la date
    if (isNaN(dateObj.getTime())) {
      console.error("❌ Date invalide:", date);
      return res.status(400).json({ error: "Format de date invalide" });
    }

    const jour = jours[dateObj.getDay()].toLowerCase();
    console.log("📅 Date analysée:", {
      input: date,
      parsed: dateObj.toISOString(),
      jour
    });

    // Configuration des plages horaires avec debug
    let plageRecherche;
    switch (period) {
      case "morning":
        plageRecherche = { start: "07:00:00", end: "11:59:59" };
        break;
      case "afternoon":
        plageRecherche = { start: "12:00:00", end: "18:59:59" };
        break;
      case "evening":
        plageRecherche = { start: "19:00:00", end: "23:59:59" };
        break;
      default:
        console.error("❌ Période invalide:", period);
        return res.status(400).json({ error: "Période invalide" });
    }

    console.log("🕒 Plage horaire configurée:", {
      period,
      plageRecherche
    });

    // Debug: Construction de la requête Supabase
    console.log("\n⚡ Exécution requête Supabase...");
    console.log("Query:", `
      SELECT 
        id, prof_id, jour, heure_debut, heure_fin,
        profs(id, nom, specialite, is_validated)
      FROM disponibilites
      WHERE jour = '${jour}'
      ORDER BY heure_debut ASC
    `);

    const { data: allDispos, error: fetchError, count } = await supabase
      .from("disponibilites")
      .select(`
        id,
        prof_id,
        jour,
        heure_debut,
        heure_fin,
        profs(id, nom, specialite, is_validated)
      `, { count: 'exact' })
      .eq("jour", jour)
      .order("heure_debut", { ascending: true });

    // Debug: Résultat de la requête
    console.log("✅ Résultat requête:", {
      count,
      error: fetchError?.message,
      firstItem: allDispos?.[0]
    });

    if (fetchError) {
      console.error("❌ Erreur Supabase:", {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      });
      throw fetchError;
    }

    console.log(`📊 ${allDispos.length} disponibilités trouvées`);

    // Conversion et filtrage avec debug
    console.log("\n🔍 Filtrage des disponibilités...");
    const toSeconds = (timeStr) => {
      if (!timeStr) return NaN;
      const parts = timeStr.split(':').map(Number);
      return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
    };

    const profsDisponibles = allDispos
      .filter(dispo => {
        // Debug: Vérification structure données
        if (!dispo.profs) {
          console.warn("⚠️ Disponibilité sans prof associé:", dispo.id);
          return false;
        }

        if (!dispo.profs.is_validated) {
          console.log(`➖ Prof non validé exclu: ${dispo.profs.id} - ${dispo.profs.nom}`);
          return false;
        }

        const debutDispo = toSeconds(dispo.heure_debut);
        const finDispo = toSeconds(dispo.heure_fin);
        const debutRecherche = toSeconds(plageRecherche.start);
        const finRecherche = toSeconds(plageRecherche.end);

        // Debug des conversions
        if (isNaN(debutDispo) || isNaN(finDispo)) {
          console.error("⛔ Format de temps invalide:", {
            id: dispo.id,
            heure_debut: dispo.heure_debut,
            heure_fin: dispo.heure_fin
          });
          return false;
        }

        const isAvailable = (
          (debutDispo >= debutRecherche && debutDispo <= finRecherche) ||
          (finDispo >= debutRecherche && finDispo <= finRecherche) ||
          (debutDispo <= debutRecherche && finDispo >= finRecherche)
        );

        if (!isAvailable) {
          console.log(`➖ Créneau non couvert: ${dispo.heure_debut}-${dispo.heure_fin} (recherche: ${plageRecherche.start}-${plageRecherche.end})`);
        }

        return isAvailable;
      })
      .map(dispo => {
        console.log(`➕ Prof disponible: ${dispo.profs.nom} (${dispo.heure_debut}-${dispo.heure_fin})`);
        return {
          id: dispo.prof_id,
          nom: dispo.profs.nom,
          specialite: dispo.profs.specialite || "Général",
          creneau: `${dispo.heure_debut} - ${dispo.heure_fin}`
        };
      });

    console.log("\n🎯 Résultat final:", {
      nbProfsDisponibles: profsDisponibles.length,
      profs: profsDisponibles
    });

    res.json({
      success: true,
      profs: profsDisponibles,
      debug: process.env.NODE_ENV === "development" ? {
        params: { date, period, jour },
        plageRecherche,
        nbTotalDispos: allDispos.length,
        requeteSupabase: {
          table: "disponibilites",
          filters: { jour },
          joins: "profs"
        }
      } : undefined
    });

  } catch (e) {
    console.error("\n❌ ERREUR GLOBALE:", {
      message: e.message,
      stack: e.stack,
      ...(e.response?.data && { apiError: e.response.data })
    });

    res.status(500).json({
      error: "Erreur serveur",
      ...(process.env.NODE_ENV === "development" && {
        details: e.message,
        stack: e.stack
      })
    });
  } finally {
    console.log("\n=== FIN REQUÊTE ===\n");
  }
});


 
// === COURS ===

app.post('/cours', authenticateToken, async (req, res) => {
  try {
    const { error: validationError } = coursSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });

    const { date, prof_id, eleve_id } = req.body;
    // Génération du lien Jitsi unique
    const slug = `${prof_id}-${eleve_id}-${Date.now()}`;
    const jitsi_url = `https://meet.jit.si/FirstArabic-${slug}`;

    const { data, error } = await req.supabase.from('cours').insert([{
      date,
      prof_id,
      eleve_id,
      statut: 'confirme',
      jitsi_url,
      created_by: req.user.id
    }]).select('*');

    if (error) throw error;

    // ✅ Récupérer les emails
    const { data: profData } = await req.supabase.from('profs').select('email').eq('id', prof_id).maybeSingle();
    const { data: eleveData } = await req.supabase.from('eleves').select('email').eq('id', eleve_id).maybeSingle();

    const emailBody = `
      <p>Un nouveau cours a été programmé.</p>
      <p>Date : ${date}</p>
      <p>Lien Jitsi : <a href="${jitsi_url}">${jitsi_url}</a></p>
    `;

    if (profData?.email) await sendEmail(profData.email, "Nouveau cours", emailBody);
    if (eleveData?.email) await sendEmail(eleveData.email, "Nouveau cours", emailBody);

    res.json({ success: true, cours: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur creation cours", details: e.message });
  }
});


app.get('/cours', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('cours')
      .select(`
        id, date, statut,
        profs (nom),
        eleves (nom)
      `);

    if (error) throw error;

    const coursAvecNoms = data.map(c => ({
      id: c.id,
      date: c.date,
      statut: c.statut,
      prof_nom: c.profs?.nom || null,
      eleve_nom: c.eleves?.nom || null
    }));

    res.json({ success: true, cours: coursAvecNoms });
  } catch (e) {
    res.status(500).json({ error: "Erreur rcupration cours enrichis", details: e.message });
  }
});

// app.get('/cours', authenticateToken, async (req, res) => {
//  try {
//    const { data, error } = await req.supabase.from('cours').select('*');
//    if (error) throw error;
//    res.json({ success: true, cours: data });
//  } catch (e) {
//    res.status(500).json({ error: "Erreur recuperation cours", details: e.message });
//  }
//});

app.get('/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from('cours')
      .select(`
        id, date, statut, jitsi_url,
        profs (nom),
        eleves (nom)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Cours introuvable" });

    res.json({
      success: true,
      cours: {
        id: data.id,
        date: data.date,
        statut: data.statut,
        jitsi_url: data.jitsi_url,
        prof_nom: data.profs?.nom || null,
        eleve_nom: data.eleves?.nom || null
      }
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération cours", details: e.message });
  }
});


//app.get('/cours/:id', authenticateToken, async (req, res) => {
//  try {
//    const { id } = req.params;
//    const { data, error } = await req.supabase.from('cours').select('*').eq('id', id).maybeSingle();
//    if (error) throw error;
//    res.json({ success: true, cours: data });
//  } catch (e) {
//    res.status(404).json({ error: "Cours non trouve", details: e.message });
//  }
//});

app.put('/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const { data, error } = await req.supabase.from('cours').update({ statut }).eq('id', id).select();
    if (error) throw error;
    res.json({ success: true, cours: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur mise a jour cours", details: e.message });
  }
});

app.delete('/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase.from('cours').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: "Cours supprime" });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression cours", details: e.message });
  }
});

 
// === PLANNING GLOBAL ===
app.get('/planning', authenticateToken, async (req, res) => {
  try {
    const statut = req.query.statut || null;

    const { data, error } = await req.supabase
      .from('cours')
      .select(`
        id, date, statut, jitsi_url,
        profs (nom),
        eleves (nom)
      `)
      .eq('created_by', req.user.id);

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

// backend/index.js (ajouter vers la fin du fichier)

// 🔐 Middleware d'authentification déjà présent
//const authenticateToken = require('./middleware/authenticateToken');

// 📅 Route: récupérer tous les créneaux RÉSERVÉS (cours confirmés)
app.get('/creneaux/reserves', authenticateToken, async (req, res) => {
  try {
    const { prof_id } = req.query;
    if (!prof_id) return res.status(400).json({ error: 'prof_id requis' });

    const { data, error } = await req.supabase
      .from('cours')
      .select('date')
      .eq('prof_id', prof_id)
      .eq('statut', 'confirme');

    if (error) throw error;

    const dureeCoursMin = 30;
    const reserves = data.map(c => {
      const start = new Date(c.date);
      const end = new Date(start.getTime() + dureeCoursMin * 60000);
      return { start: start.toISOString(), end: end.toISOString() };
    });

    res.json({ success: true, reserves });
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération créneaux réservés', details: e.message });
  }
});

// 📆 Route: récupérer tous les créneaux DISPONIBLES (via disponibilites)

app.get('/creneaux/disponibles', authenticateToken, async (req, res) => {
  try {
    const { prof_id } = req.query;
    if (!prof_id) return res.status(400).json({ error: 'prof_id requis' });

    // 🔹 Étape 1: récupérer les disponibilités hebdo du prof
    const { data: disponibilites, error: dispoError } = await req.supabase
      .from('disponibilites')
      .select('jour, heure_debut, heure_fin')
      .eq('prof_id', prof_id);

    if (dispoError) throw dispoError;

    // 🔹 Étape 2: générer les créneaux pour la prochaine semaine
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

      const [hStart, mStart] = dispo.heure_debut.split(':').map(Number);
      const [hEnd, mEnd] = dispo.heure_fin.split(':').map(Number);

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

    // 🔹 Étape 3: récupérer les créneaux réservés
    const { data: reserves, error: reserveError } = await req.supabase
      .from('cours')
      .select('date')
      .eq('prof_id', prof_id)
      .eq('statut', 'confirme');

    if (reserveError) throw reserveError;

    const reservesSet = new Set(reserves.map(r => new Date(r.date).toISOString()));

    // 🔹 Étape 4: filtrer les creneaux déjà réservés
    const disponibles = prochainsCreneaux.filter(c => !reservesSet.has(c.start));

    res.json({ success: true, disponibles });
  } catch (e) {
    res.status(500).json({ error: 'Erreur récupération disponibilités filtrées', details: e.message });
  }
});


// verifier  les emails lors de l'enregistrement pour detecter les emails deja utilise


const emailCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requêtes
  message: "Trop de tentatives. Réessayez plus tard.",
});

app.post("/check-email", emailCheckLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Format d'email invalide" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Erreur Supabase" });
    }

    const exists = data.users.some((u) => u.email === email);
    console.log(`🔍 Vérif email : ${email} → ${exists ? "EXISTE" : "DISPO"}`);

    return res.json({ exists });
  } catch (err) {
    console.error("❌ Exception:", err);
    return res.status(503).json({ error: "Service indisponible" });
  }
});








// notifications

app.post("/notifications", authenticateToken, notificationsController.createNotification);
app.get("/notifications", authenticateToken, notificationsController.getNotifications);
app.put("/notifications/:id", authenticateToken, notificationsController.markAsRead);
app.delete("/notifications/:id", authenticateToken, notificationsController.deleteNotification);

// disponibilite

app.post("/disponibilites", authenticateToken, disponibilitesController.createDisponibilite);
app.get("/disponibilites", authenticateToken, disponibilitesController.getDisponibilites);

app.get("/disponibilites/:id", authenticateToken, disponibilitesController.getDisponibiliteById);
app.put("/disponibilites/:id", authenticateToken, disponibilitesController.updateDisponibilite);
app.delete("/disponibilites/:id", authenticateToken, disponibilitesController.deleteDisponibilite);
app.patch("/disponibilites/:id", authenticateToken, disponibilitesController.updateDisponibilite);

// reservations
app.post("/reservations", authenticateToken, reservationsController.createReservation);
app.get("/reservations", authenticateToken, reservationsController.getReservations);
app.get("/reservations/:id", authenticateToken, reservationsController.getReservationById);
app.delete("/reservations/:id", authenticateToken, reservationsController.deleteReservation);
app.put("/reservations/:id", authenticateToken, reservationsController.updateReservation);

//  index.js

app.post("/stripe/webhook", express.raw({ type: 'application/json' }), paiementController.handleStripeWebhook);
// abonnements
app.get('/abonnements', authenticateToken, abonnementController.getAbonnementsForUser);
app.get('/abonnements/all', authenticateToken, abonnementController.getAllAbonnements); // 🔒 Pour admin ou consultation
app.post('/abonnements/checkout', authenticateToken, abonnementController.createCheckoutSession); // 🚀 Démarre un paiement Stripe




app.listen(PORT, () => {
  console.log(`API en ecoute sur http://localhost:${PORT}`);
});
