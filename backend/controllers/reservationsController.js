const {
  createReservationSchema,
  updateReservationSchema
} = require('../validators/reservationValidator');

const dayjs = require('dayjs');
require('dayjs/locale/fr');
dayjs.locale('fr');

// Créer une réservation avec vérification de disponibilité
const createReservation = async (req, res) => {
  const { prof_id, date, heure_debut, heure_fin, statut } = req.body;
  const { id: eleve_id } = req.user;

  const { error: validationError } = createReservationSchema.validate({ prof_id, date, heure_debut, heure_fin, statut });
  if (validationError) {
    return res.status(400).json({ error: "Données invalides", details: validationError.details });
  }

  const jourSemaine = dayjs(date).format('dddd');

  const { data: disponibilites, error: dispoError } = await req.supabase
    .from('disponibilites')
    .select('*')
    .eq('prof_id', prof_id)
    .eq('jour', jourSemaine)
    .lte('heure_debut', heure_debut)
    .gte('heure_fin', heure_fin);

  if (dispoError) {
    return res.status(500).json({ error: "Erreur lors de la vérification de disponibilité", details: dispoError.message });
  }

  if (!disponibilites || disponibilites.length === 0) {
    return res.status(400).json({ error: `Le professeur n'est pas disponible le ${jourSemaine} entre ${heure_debut} et ${heure_fin}.` });
  }

  const { data, error } = await req.supabase
    .from('reservations')
    .insert([{ eleve_id, prof_id, date, heure_debut, heure_fin, statut }])
    .select();

  if (error) {
    return res.status(500).json({ error: "Erreur lors de la création de la réservation", details: error.message });
  }

  res.json({ success: true, reservation: data[0] });
};

// Récupérer toutes les réservations de l'élève connecté
const getReservations = async (req, res) => {
  const eleve_id = req.user.id;

  try {
    const { data, error } = await req.supabase
      .from('reservations')
      .select(`
        id, date, heure_debut, heure_fin, statut,
        profs (nom),
        eleves (nom)
      `)
      .eq('eleve_id', eleve_id);

    if (error) throw error;

    const result = data.map(r => ({
      id: r.id,
      date: r.date,
      heure_debut: r.heure_debut,
      heure_fin: r.heure_fin,
      statut: r.statut,
      prof_nom: r.profs?.nom || null,
      eleve_nom: r.eleves?.nom || null
    }));

    res.json({ success: true, reservations: result });
  } catch (e) {
    res.status(500).json({ error: "Erreur lors de la récupération des réservations", details: e.message });
  }
};

// Récupérer une réservation par ID
const getReservationById = async (req, res) => {
  const { id } = req.params;
  const eleve_id = req.user.id;

  try {
    const { data, error } = await req.supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('eleve_id', eleve_id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Réservation introuvable" });

    res.json({ success: true, reservation: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur récupération réservation", details: e.message });
  }
};

// Mettre à jour une réservation
const updateReservation = async (req, res) => {
  const { id } = req.params;
  const eleve_id = req.user.id;
  const updates = req.body;

  const { error: validationError } = updateReservationSchema.validate(updates);
  if (validationError) {
    return res.status(400).json({ error: "Données invalides", details: validationError.details });
  }

  try {
    const { data, error } = await req.supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .eq('eleve_id', eleve_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Réservation introuvable" });

    res.json({ success: true, reservation: data });
  } catch (e) {
    res.status(500).json({ error: "Erreur mise à jour réservation", details: e.message });
  }
};

// Supprimer une réservation
const deleteReservation = async (req, res) => {
  const { id } = req.params;
  const eleve_id = req.user.id;

  try {
    const { error } = await req.supabase
      .from('reservations')
      .delete()
      .eq('id', id)
      .eq('eleve_id', eleve_id);

    if (error) throw error;
    res.json({ success: true, message: "Réservation supprimée" });
  } catch (e) {
    res.status(500).json({ error: "Erreur suppression réservation", details: e.message });
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  deleteReservation
};
