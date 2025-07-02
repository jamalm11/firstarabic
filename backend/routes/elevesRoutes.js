// routes/elevesRoutes.js
const express = require('express');
const router = express.Router();

const { eleveInputSchema } = require('../validators/eleveValidator');
const authenticateToken = require('../middleware/authenticateToken');
const supabaseAdmin = require('../supabaseAdminClient');
const { sendEmail } = require("../utils/email");



// 🆕 Créer un élève
router.post("/", authenticateToken, async (req, res) => {
  console.log("🎯 [POST /eleves] Requête reçue:", req.body);

  const { error: validationError } = eleveInputSchema.validate({
  nom: req.body.nom,
  email: req.body.email,
  });
  if (validationError) {
    console.warn("❌ Données invalides:", validationError.details[0].message);
    return res.status(400).json({ error: "Données invalides", details: validationError.details[0].message });
  }

  const { nom, email } = req.body;
  const userId = req.user?.id;

  try {
    const { data, error } = await supabaseAdmin
      .from("eleves")
      .insert([{ nom, email, created_by: userId }])
      .select();

    if (error) throw error;

    console.log("✅ Élève créé:", data[0]);

    // 📧 Envoi de l'email de bienvenue
   

       await sendEmail(
       email,
       "Bienvenue sur FirstArabic ! 🌟",
       `
        <h2>Bienvenue ${nom} !</h2>
        <p>Votre compte a été créé avec succès. Vous pouvez maintenant réserver des cours sur notre plateforme.</p>
        <p><a href="https://firstarabic.com">Accéder à la plateforme</a></p>
       `
       );

        
    
    res.json({ success: true, eleve: data[0] });
  } catch (e) {
    console.error("💥 Erreur création élève:", e.message);
    res.status(500).json({ error: "Erreur creation eleve", details: e.message });
  }
});



// 🔎 Liste des élèves du user connecté
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('eleves')
      .select('*')
      .eq('created_by', req.user.id);

    if (error) throw error;
    console.log("📋 Liste des élèves:", data);
    res.json({ success: true, eleves: data });
  } catch (e) {
    console.error("💥 Erreur récupération élèves:", e.message);
    res.status(500).json({ error: "Erreur recuperation eleves", details: e.message });
  }
});

// 🔎 Détail d’un élève
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('eleves')
      .select('*')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .maybeSingle();

    if (error) throw error;
    console.log("📄 Élève récupéré:", data);
    res.json({ success: true, eleve: data });
  } catch (e) {
    console.error("💥 Erreur récupération élève:", e.message);
    res.status(404).json({ error: "eleve non trouve", details: e.message });
  }
});

// ✏️ Modifier un élève
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: "Nom requis" });

    const { data, error } = await supabaseAdmin
      .from('eleves')
      .update({ nom })
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select();

    if (error) throw error;
    console.log("✏️ Élève mis à jour:", data[0]);
    res.json({ success: true, eleve: data[0] });
  } catch (e) {
    console.error("💥 Erreur mise à jour élève:", e.message);
    res.status(500).json({ error: "Erreur mise a jour eleve", details: e.message });
  }
});

// 🗑️ Supprimer un élève
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('eleves')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;
    console.log("🗑️ Élève supprimé ID:", id);
    res.json({ success: true, message: "eleve supprime" });
  } catch (e) {
    console.error("💥 Erreur suppression élève:", e.message);
    res.status(500).json({ error: "Erreur suppression eleve", details: e.message });
  }
});

module.exports = router;
