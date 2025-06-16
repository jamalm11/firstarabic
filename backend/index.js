const reservationsController = require('./controllers/reservationsController');
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');
const { eleveSchema } = require('./validators/eleveValidator');

const app = express();
const PORT = 3001;

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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

const { coursSchema } = require('./validators/coursValidator');
const { profSchema } = require('./validators/profValidator');

// ========== ROUTES ==========

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


// === PROF ===
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

// === COURS ===
app.post('/cours', authenticateToken, async (req, res) => {
  try {
    const { error: validationError } = coursSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });
    const { date, prof_id, eleve_id } = req.body;
    const { data, error } = await req.supabase.from('cours').insert([{ date, prof_id, eleve_id, statut: 'confirme', created_by: req.user.id }]).select();
    if (error) throw error;
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
        id, date, statut,
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


// notifications
const notificationsController = require("./controllers/notificationsController");

app.post("/notifications", authenticateToken, notificationsController.createNotification);
app.get("/notifications", authenticateToken, notificationsController.getNotifications);
app.put("/notifications/:id", authenticateToken, notificationsController.markAsRead);
app.delete("/notifications/:id", authenticateToken, notificationsController.deleteNotification);

// disponibilite
const disponibilitesController = require("./controllers/disponibilitesController");

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

app.listen(PORT, () => {
  console.log(`API en ecoute sur http://localhost:${PORT}`);
});
