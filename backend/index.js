// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require("express-rate-limit");
const authenticateToken = require('./middleware/authenticateToken');
const reviewsRoutes = require("./routes/reviewsRoutes");
const bookingRoutes = require('./routes/bookingRoutes'); // 🆕 Routes de réservation
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

// 🆕 Routes de réservation (nouveau système)
app.use('/booking', bookingRoutes);

// Routes existantes
app.use('/eleves', require('./routes/elevesRoutes'));
app.use('/profs', require('./routes/profRoutes'));
app.use('/cours', require('./routes/coursRoutes'));
app.use('/disponibilites', require('./routes/disponibilitesRoutes'));
app.use('/reservations', require('./routes/reservationsRoutes'));
app.use('/notifications', require('./routes/notificationsRoutes'));
app.use('/abonnements', require('./routes/abonnementRoutes'));
app.use('/planning', require('./routes/planningRoutes'));
app.use('/check-email', require('./routes/checkEmailRoutes'));
app.use('/stripe', require('./routes/stripeRoutes'));
app.use("/reviews", reviewsRoutes);

// 🔧 Routes nettoyées (suppression du doublon)
// app.use('/creneaux', require('./routes/planningRoutes')); // ❌ Doublon supprimé
// app.use('/auth', require('./routes/authRoutes')); // Si activée plus tard

// ✅ Route de test
app.get('/', (req, res) => {
  res.json({ 
    status: "🚀 API FirstArabic opérationnelle !",
    version: "2.0",
    features: [
      "Auto-création de profils",
      "Système de réservation",
      "Dashboard temps réel",
      "Notifications automatiques"
    ]
  });
});

// 🔍 Route de debug pour les endpoints disponibles
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ 
    message: "Routes disponibles",
    routes: [
      "GET /booking/availability/:profId",
      "POST /booking/availability", 
      "GET /booking/availability/slots/:profId/:date",
      "POST /booking/reservations",
      "GET /booking/reservations/me",
      "PUT /booking/reservations/:id/confirm",
      "PUT /booking/reservations/:id/refuse",
      "DELETE /booking/reservations/:id",
      "...autres routes existantes"
    ]
  });
});

// ❌ Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// 🔍 Gestionnaire pour routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl,
    suggestion: 'Vérifiez l\'URL ou consultez /debug/routes'
  });
});

// Lancement serveur
app.listen(PORT, () => {
  console.log(`✅ API en écoute sur http://localhost:${PORT}`);
  console.log(`🔗 Routes debug : http://localhost:${PORT}/debug/routes`);
  console.log(`🆕 Nouvelles routes booking : /booking/*`);
});

module.exports = app;
