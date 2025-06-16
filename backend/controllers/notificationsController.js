const { notificationSchema, updateNotificationSchema } = require('../validators/notificationValidator');

// Créer une notification
const createNotification = async (req, res) => {
  const { message, type } = req.body;
  const { id: user_id } = req.user;

  const { data, error } = await req.supabase
    .from('notifications')
    .insert([{ message, type, user_id }])
    .select();

  if (error) {
    return res.status(400).json({ error: "Erreur création notification", details: error.message });
  }

  res.json({ success: true, notification: data[0] });
};

// Lire les notifications avec pagination et tri
const getNotifications = async (req, res) => {
  const { id: user_id } = req.user;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await req.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return res.status(500).json({ error: "Erreur récupération notifications", details: error.message });
  }

  res.json({ success: true, page, limit, notifications: data });
};

// Marquer une notification comme lue
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

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Notification non trouvée" });
  }

  res.json({ success: true, notification: data[0] });
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const { id: user_id } = req.user;

  const { data, error } = await req.supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
    .select();

  if (error) {
    return res.status(500).json({ error: "Erreur suppression notification", details: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Notification non trouvée" });
  }

  res.json({ success: true, message: "Notification supprimée" });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification
};
