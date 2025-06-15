const Joi = require('joi');

const profSchema = Joi.object({
  nom: Joi.string().required(),
  specialite: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional()
});

module.exports = { profSchema };
