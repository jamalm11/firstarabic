const Joi = require('joi');

// Schéma de validation pour création/mise à jour d'un élève
const eleveSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required()
});

module.exports = { eleveSchema };
