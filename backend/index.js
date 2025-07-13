// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require("express-rate-limit");
const authenticateToken = require('./middleware/authenticateToken');
const reviewsRoutes = require("./routes/reviewsRoutes");
const app = express();
const PORT = 3001;

// Middleware globaux
app.use(cors());
app.use(express.json());

// Supabase public client (lecture publique non protégée)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// 🔍 Logger global
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========== ROUTES ==========

app.use('/eleves', require('./routes/elevesRoutes'));
app.use('/profs', require('./routes/profRoutes'));
app.use('/cours', require('./routes/coursRoutes'));  // ✅ Route des cours bien positionnée
app.use('/disponibilites', require('./routes/disponibilitesRoutes'));
app.use('/reservations', require('./routes/reservationsRoutes'));
app.use('/notifications', require('./routes/notificationsRoutes'));
app.use('/abonnements', require('./routes/abonnementRoutes'));
app.use('/planning', require('./routes/planningRoutes'));
app.use('/creneaux', require('./routes/planningRoutes')); // ⚠️ attention doublon possible
app.use('/check-email', require('./routes/checkEmailRoutes'));
app.use('/stripe', require('./routes/stripeRoutes'));
app.use("/reviews", reviewsRoutes);
// app.use('/auth', require('./routes/authRoutes')); // si activée plus tard

// ✅ Route de test
app.get('/', (req, res) => {
  res.json({ status: "🚀 API FirstArabic opérationnelle !" });
});

// Lancement serveur
app.listen(PORT, () => {
  console.log(`✅ API en écoute sur http://localhost:${PORT}`);
});
