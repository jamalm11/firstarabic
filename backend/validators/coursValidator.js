// backend/validators/coursValidator.js
const Joi = require('joi');

const coursSchema = Joi.object({
  date: Joi.date().iso().required(),
  prof_id: Joi.string().uuid().required(),
  eleve_id: Joi.string().uuid().required(),
  jitsi_url: Joi.string().uri().optional(),
  statut: Joi.string().valid('prévu', 'annulé', 'terminé').optional(),
  created_by: Joi.string().uuid().optional(),
  created_at: Joi.date().optional()
});

module.exports = { coursSchema };
