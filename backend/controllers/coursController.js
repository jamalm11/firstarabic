const pool = require('../db');
const { coursSchema } = require('../validators/coursValidator');

// 🔸 Créer un cours
const createCours = async (req, res) => {
  const { error: validationError } = coursSchema.validate(req.body);
  if (validationError) return res.status(400).json({ error: validationError.details[0].message });

  const { date, prof_id, eleve_id, statut } = req.body;
  const created_by = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO cours (date, prof_id, eleve_id, statut, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [date, prof_id, eleve_id, statut, created_by]
    );
    res.json({ success: true, cours: result.rows[0] });
  } catch (err) {
    console.error('Erreur création cours:', err);
    res.status(500).json({ error: "Erreur serveur lors de la création du cours" });
  }
};

// 🔸 Récupérer tous les cours
const getAllCours = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, e.nom AS eleve_nom, p.nom AS prof_nom
      FROM cours c
      JOIN eleves e ON c.eleve_id = e.id
      JOIN profs p ON c.prof_id = p.id
      ORDER BY c.date DESC
    `);
    res.json({ success: true, cours: result.rows });
  } catch (err) {
    console.error('Erreur récupération cours:', err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des cours" });
  }
};

// 🔸 Récupérer un cours par ID
const getCoursById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      `SELECT * FROM cours WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cours introuvable" });
    }
    res.json({ success: true, cours: result.rows[0] });
  } catch (err) {
    console.error('Erreur récupération cours:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔸 Mettre à jour un cours
const updateCours = async (req, res) => {
  const id = req.params.id;
  const { date, statut } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cours
       SET date = COALESCE($1, date),
           statut = COALESCE($2, statut)
       WHERE id = $3
       RETURNING *`,
      [date, statut, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cours non trouvé" });
    }
    res.json({ success: true, cours: result.rows[0] });
  } catch (err) {
    console.error('Erreur mise à jour cours:', err);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour" });
  }
};

// 🔸 Supprimer un cours
const deleteCours = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      `DELETE FROM cours WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cours introuvable" });
    }
    res.json({ success: true, message: "Cours supprimé" });
  } catch (err) {
    console.error('Erreur suppression cours:', err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
};

module.exports = {
  createCours,
  getAllCours,
  getCoursById,
  updateCours,
  deleteCours
};
