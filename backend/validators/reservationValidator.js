const Joi = require('joi');

const createReservationSchema = Joi.object({
  prof_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  heure_debut: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  heure_fin: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  statut: Joi.string().valid('en_attente', 'confirmee', 'annulee').required()
});

module.exports = { createReservationSchema };
