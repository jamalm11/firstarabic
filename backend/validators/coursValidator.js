// backend/validators/coursValidator.js
const Joi = require('joi');

const coursSchema = Joi.object({
  date: Joi.date().iso().required(),
  prof_id: Joi.string().uuid().required(),
  eleve_id: Joi.string().uuid().required(),
});

module.exports = { coursSchema };
