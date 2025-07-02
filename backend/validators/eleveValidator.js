const Joi = require('joi');

const eleveInputSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional()
});

const eleveSchema = Joi.object({
  nom: Joi.string().required(),
  email: Joi.string().email().optional(),
  created_by: Joi.string().uuid().required()
});

module.exports = { eleveSchema, eleveInputSchema };
