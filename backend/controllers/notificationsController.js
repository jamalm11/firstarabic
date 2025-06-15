// backend/controllers/notificationsController.js

const { notificationSchema, updateNotificationSchema } = require('../validators/notificationValidator');

// Ce contrôleur utilise req.supabase qui contient un client authentifié (avec JWT)
const createNotification = async (req, res) => {
  const { error: validationError } = notificationSchema.validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: "Données invalides", details: validationError.details[0].message });
  }

  const { titre, message, lu } = req.body;
  const { id: user_id } = req.user;

  const { data, error } = await req.supabase
    .from('notifications')
    .insert([{ titre, message, lue: lu ?? false, user_id }])
    .select();

  if (error) {
    return res.status(400).json({ error: "Erreur création notification", details: error.message });
  }

  res.json({ success: true, notification: data[0] });
};

const getNotifications = async (req, res) => {
  const { id: user_id } = req.user;

  const { data, error } = await req.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id);

  if (error) {
    return res.status(500).json({ error: "Erreur récupération notifications", details: error.message });
  }

  res.json({ success: true, notifications: data });
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  const { id: user_id } = req.user;

  const { data, error } = await req.supabase
    .from('notifications')
    .update({ lue: true })
    .eq('id', id)
    .eq('user_id', user_id)
    .select();

  if (error) {
    return res.status(500).json({ error: "Erreur mise à jour notification", details: error.message });
  }

  res.json({ success: true, notification: data[0] });
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const { id: user_id } = req.user;

  const { error } = await req.supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);

  if (error) {
    return res.status(500).json({ error: "Erreur suppression notification", details: error.message });
  }

  res.json({ success: true, message: "Notification supprimée" });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification
};
