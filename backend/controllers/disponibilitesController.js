const Joi = require('joi');

// Schéma de validation Joi pour les disponibilités
const disponibiliteSchema = Joi.object({
  jour: Joi.string().valid(
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ).required(),
  heure_debut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  heure_fin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  prof_id: Joi.string().uuid().required()
});


// Schéma de validation pour PATCH (tous les champs sont optionnels)
const updateDisponibiliteSchema = Joi.object({
  jour: Joi.string().valid(
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ),
  heure_debut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  heure_fin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});


exports.createDisponibilite = async (req, res) => {
  try {
    // 1. Validation des données entrantes
    const { error: validationError } = disponibiliteSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ 
        error: "Données invalides", 
        details: validationError.details[0].message 
      });
    }

    // 2. Vérification que le prof appartient à l'utilisateur
    const { data: prof, error: profError } = await req.supabase
      .from('profs')
      .select('id')
      .eq('id', req.body.prof_id)
      .eq('created_by', req.user.id)
      .maybeSingle();

    if (profError) throw profError;
    if (!prof) {
      return res.status(403).json({ 
        error: "Non autorisé", 
        details: "Ce professeur ne vous appartient pas" 
      });
    }

    // 3. Préparation des données avec created_by
    const disponibiliteData = {
      ...req.body,
      created_by: req.user.id
    };

    // 4. Insertion dans la base de données
    const { data, error: insertError } = await req.supabase
      .from('disponibilites')
      .insert([disponibiliteData])
      .select();

    if (insertError) throw insertError;

    // 5. Réponse réussie
    res.status(201).json(data[0]);

  } catch (e) {
    console.error("Erreur création disponibilité:", e);
    res.status(500).json({ 
      error: "Erreur création disponibilité", 
      details: e.message 
    });
  }
};

exports.getDisponibilites = async (req, res) => {
  try {
    // Récupération des disponibilités avec jointure sur profs
    const { data, error } = await req.supabase
      .from('disponibilites')
      .select(`
        id,
        jour,
        heure_debut,
        heure_fin,
        created_at,
        profs (id, nom)
      `)
      .eq('created_by', req.user.id)
      .order('jour', { ascending: true })
      .order('heure_debut', { ascending: true });

    if (error) throw error;

    // Formatage des données de réponse
    const formattedData = data.map(item => ({
      id: item.id,
      jour: item.jour,
      heure_debut: item.heure_debut,
      heure_fin: item.heure_fin,
      created_at: item.created_at,
      prof: item.profs
    }));

    res.json(formattedData);

  } catch (e) {
    console.error("Erreur récupération disponibilités:", e);
    res.status(500).json({ 
      error: "Erreur récupération disponibilités", 
      details: e.message 
    });
  }
};


// 📌 Lire une seule disponibilité
exports.getDisponibiliteById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await req.supabase
      .from('disponibilites')
      .select(`
        id, jour, heure_debut, heure_fin, created_at,
        profs (id, nom)
      `)
      .eq('created_by', req.user.id)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Disponibilité non trouvée" });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération", details: e.message });
  }
};



// 📌 Modifier une disponibilité (PATCH partiel)
exports.updateDisponibilite = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validation partielle
    const { error: validationError } = updateDisponibiliteSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: "Données invalides", details: validationError.details[0].message });
    }

    // 🔒 Vérification que l'utilisateur est bien propriétaire de la disponibilité
    const { data: existing, error: fetchError } = await req.supabase
      .from('disponibilites')
      .select('id')
      .eq('id', id)
      .eq('created_by', req.user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return res.status(404).json({ error: "Disponibilité non trouvée ou non autorisée" });
    }

    // ✏️ Mise à jour
    const { data, error } = await req.supabase
      .from('disponibilites')
      .update(req.body)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("Erreur mise à jour disponibilité:", e);
    res.status(500).json({ error: "Erreur mise à jour", details: e.message });
  }
};


// 📌 Supprimer une disponibilité
exports.deleteDisponibilite = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await req.supabase
      .from('disponibilites')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id);

    if (error) throw error;

    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression", details: e.message });
  }
};
