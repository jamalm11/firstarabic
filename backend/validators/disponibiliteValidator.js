const Joi = require('joi');

// Schéma complet pour POST
const disponibiliteSchema = Joi.object({
  jour: Joi.string().valid(
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ).required(),
  heure_debut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  heure_fin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  prof_id: Joi.string().uuid().required()
});

// Schéma partiel pour PATCH
const updateDisponibiliteSchema = Joi.object({
  jour: Joi.string().valid(
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ),
  heure_debut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  heure_fin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

module.exports = { disponibiliteSchema, updateDisponibiliteSchema };
