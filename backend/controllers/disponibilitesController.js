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
