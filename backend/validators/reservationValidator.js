// backend/validators/reservationValidator.js
const Joi = require('joi');

const createReservationSchema = Joi.object({
  prof_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  heure_debut: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  heure_fin: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  statut: Joi.string().valid('en_attente', 'confirmee', 'annulee').required()
});

// Pour update : tous les champs sont optionnels, mais il faut au moins un champ
const updateReservationSchema = Joi.object({
  prof_id: Joi.string().uuid(),
  date: Joi.date().iso(),
  heure_debut: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  heure_fin: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  statut: Joi.string().valid('en_attente', 'confirmee', 'annulee')
}).min(1); // au moins un champ doit être fourni

module.exports = {
  createReservationSchema,
  updateReservationSchema
};
