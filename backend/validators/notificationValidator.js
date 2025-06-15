// backend/validators/notificationValidator.js

const Joi = require('joi');

const notificationSchema = Joi.object({
  titre: Joi.string().min(3).max(100).required(),
  message: Joi.string().min(3).max(500).required(),
  lu: Joi.boolean().optional() // généralement false à la création
});

const updateNotificationSchema = Joi.object({
  titre: Joi.string().min(3).max(100),
  message: Joi.string().min(3).max(500),
  lu: Joi.boolean()
});

module.exports = {
  notificationSchema,
  updateNotificationSchema
};
