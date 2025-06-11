require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');

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

const reservationSchema = Joi.object({
  date: Joi.date().iso().required(),
  prof_id: Joi.string().required(),
  eleve_id: Joi.string().required()
});

const profSchema = Joi.object({
  nom: Joi.string().required(),
  specialite: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional()
});

// ========== ROUTES ==========

app.get('/', (req, res) => {
  res.json({ status: "API FirstArabic opérationnelle !" });
});

// === ELEVE ===
app.post('/eleve', authenticateToken, async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: "Nom requis" });
    const { data, error } = await req.supabase.from('eleves').insert([{ nom, created_by: req.user.id }]).select();
    if (error) throw error;
    res.json({ success: true, eleve: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur création élève", details: e.message });
  }
});

app.get('/eleves', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('eleves').select('*').eq('created_by', req.user.id);
    if (error) throw error;
    res.json({ success: true, eleves: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération élèves", details: e.message });
  }
});

// ✅ NOUVELLES ROUTES ELEVE
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
    res.status(404).json({ error: "Élève non trouvé", details: e.message });
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
    res.status(500).json({ error: "Erreur mise à jour élève", details: e.message });
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
    res.json({ success: true, message: "Élève supprimé" });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression élève", details: e.message });
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
    res.status(500).json({ error: "Erreur récupération profs", details: e.message });
  }
});

app.get('/prof/me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('profs').select('*').eq('created_by', req.user.id).maybeSingle();
    if (error) throw error;
    res.json({ success: true, prof: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération profil prof", details: e.message });
  }
});

// === COURS ===
app.post('/cours', authenticateToken, async (req, res) => {
  try {
    const { error: validationError } = reservationSchema.validate(req.body);
    if (validationError) return res.status(400).json({ error: validationError.details[0].message });
    const { date, prof_id, eleve_id } = req.body;
    const { data, error } = await req.supabase.from('cours').insert([{ date, prof_id, eleve_id, statut: 'confirmé', created_by: req.user.id }]).select();
    if (error) throw error;
    res.json({ success: true, cours: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur création cours", details: e.message });
  }
});

app.get('/cours', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('cours').select('*');
    if (error) throw error;
    res.json({ success: true, cours: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération cours", details: e.message });
  }
});

app.get('/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase.from('cours').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    res.json({ success: true, cours: data });
  } catch (e) {
    res.status(404).json({ error: "Cours non trouvé", details: e.message });
  }
});

app.put('/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const { data, error } = await req.supabase.from('cours').update({ statut }).eq('id', id).select();
    if (error) throw error;
    res.json({ success: true, cours: data[0] });
  } catch (e) {
    res.status(500).json({ error: "Erreur mise à jour cours", details: e.message });
  }
});

app.delete('/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase.from('cours').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: "Cours supprimé" });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression cours", details: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`API en écoute sur http://localhost:${PORT}`);
});
