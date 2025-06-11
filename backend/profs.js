// backend/profs.js
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Route publique : liste des profs
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("profs").select("*");

  if (error) {
    console.error("Erreur Supabase :", error);
    return res.status(500).json({ error: "Erreur lors de la récupération des profs" });
  }

  res.json(data);
});

module.exports = router;
