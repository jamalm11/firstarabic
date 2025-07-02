
// backend/validators/notificationValidator.js

const Joi = require('joi');

const notificationSchema = Joi.object({
  message: Joi.string().min(3).max(500).required(),
  type: Joi.string().valid('info', 'alerte', 'erreur').default('info'),
  lue: Joi.boolean().optional() // généralement false à la création
});

const updateNotificationSchema = Joi.object({
  message: Joi.string().min(3).max(500),
  type: Joi.string().valid('info', 'alerte', 'erreur'),
  lue: Joi.boolean()
}).min(1); // Au moins un champ obligatoire pour update

module.exports = {
  notificationSchema,
  updateNotificationSchema
};
