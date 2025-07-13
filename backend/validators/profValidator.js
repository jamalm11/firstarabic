// backend/validators/profValidator.js
const Joi = require('joi');

// 🆕 Schema étendu pour supporter les nouvelles colonnes
const profSchema = Joi.object({
  // Colonnes existantes (obligatoires)
  nom: Joi.string().required(),
  
  // Colonnes existantes (optionnelles) - rétrocompatibilité
  specialite: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  
  // 🆕 Nouvelles colonnes (optionnelles)
  photo_url: Joi.string().uri().allow('').optional(),
  video_intro_url: Joi.string().uri().allow('').optional(),
  specialites: Joi.array().items(Joi.string()).optional(),
  langues_parlees: Joi.array().items(Joi.string()).optional(),
  prix_30min: Joi.number().positive().precision(2).optional(),
  prix_60min: Joi.number().positive().precision(2).optional(),
  experience_annees: Joi.number().integer().min(0).optional(),
  pays_origine: Joi.string().allow('').optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  disponible_maintenant: Joi.boolean().optional()
});

// 🆕 Schema pour mise à jour partielle (toutes colonnes optionnelles)
const profUpdateSchema = Joi.object({
  nom: Joi.string().optional(),
  specialite: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  photo_url: Joi.string().uri().allow('').optional(),
  video_intro_url: Joi.string().uri().allow('').optional(),
  specialites: Joi.array().items(Joi.string()).optional(),
  langues_parlees: Joi.array().items(Joi.string()).optional(),
  prix_30min: Joi.number().positive().precision(2).optional(),
  prix_60min: Joi.number().positive().precision(2).optional(),
  experience_annees: Joi.number().integer().min(0).optional(),
  pays_origine: Joi.string().allow('').optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  disponible_maintenant: Joi.boolean().optional()
});

module.exports = { 
  profSchema, 
  profUpdateSchema 
};
