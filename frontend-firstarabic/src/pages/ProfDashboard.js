// src/pages/ProfDashboard.js - VERSION ULTRA-SIMPLE SANS BOUCLES
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";
import './ProfDashboard.css';

// Composants pour les onglets de réservation
import AvailabilityManagement from "../components/AvailabilityManagement";
import ReservationsDashboard from "../components/ReservationsDashboard";

function ProfDashboard() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [profProfile, setProfProfile] = useState(null);
  const [stats, setStats] = useState({
    totalCours: 0,
    coursAVenir: 0,
    coursFinis: 0,
    evaluations: 0,
    noteMoyenne: 0,
    revenus: 0
  });
  const [prochainsCours, setProchainsCours] = useState([]);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🔧 INIT UNIQUE - PAS DE BOUCLE
  useEffect(() => {
    let isInitialized = false; // 🛡️ Protection contre double appel
    
    const initApp = async () => {
      if (isInitialized) {
        console.log("🚫 Initialisation déjà en cours, arrêt");
        return;
      }
      
      isInitialized = true;
      console.log("🚀 Initialisation unique du dashboard");
      
      try {
        // 1. Récupérer la session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("❌ Pas de session");
          setLoading(false);
          return;
        }

        console.log("✅ Session trouvée");
        setSession(session);
        setToken(session.access_token);

        // 2. Charger le profil
        await loadProfile(session.access_token);

      } catch (error) {
        console.error("❌ Erreur init:", error);
        setLoading(false);
      }
    };

    initApp();
    
    // Cleanup function
    return () => {
      isInitialized = false;
    };
  }, []); // 🔧 AUCUNE DÉPENDANCE = AUCUNE BOUCLE

  const loadProfile = async (accessToken) => {
    try {
      console.log("🔍 Chargement profil...");
      
      const profResponse = await axios.get('http://localhost:3001/profs/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (profResponse.data.success && profResponse.data.prof) {
        console.log("✅ Profil trouvé");
        setProfProfile(profResponse.data.prof);
        await loadData(profResponse.data.prof, accessToken);
        
      } else {
        console.log("🆕 Créer profil");
        await createProfile(accessToken);
      }
      
    } catch (err) {
      console.error("❌ Erreur profil:", err);
      if (err.response?.status === 404) {
        await createProfile(accessToken);
      } else {
        setLoading(false);
      }
    }
  };

  const createProfile = async (accessToken) => {
    if (isCreatingProfile) return;
    
    setIsCreatingProfile(true);
    
    try {
      const userMetadata = session?.user?.user_metadata || {};
      const email = session?.user?.email || '';
      
      const nom = userMetadata.full_name || 
                 userMetadata.name || 
                 email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') || 
                 'Professeur';

      const profileData = {
        nom: nom,
        specialite: 'Arabe général',
        bio: `Professeur d'arabe passionné.`,
        specialites: ['Arabe général', 'Conversation'],
        langues_parlees: ['Arabe', 'Français'],
        prix_30min: 15.00,
        prix_60min: 25.00,
        experience_annees: 1,
        pays_origine: 'Maroc',
        disponible_maintenant: false
      };

      const createResponse = await axios.post('http://localhost:3001/profs', profileData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (createResponse.data.success) {
        setProfProfile(createResponse.data.prof);
        await loadData(createResponse.data.prof, accessToken);
      }
      
    } catch (createError) {
      console.error("❌ Erreur création:", createError);
      setProfProfile({
        nom: session?.user?.email?.split('@')[0] || 'Professeur',
        is_validated: false,
        rating_moyen: 0,
        nombre_avis: 0,
        prix_30min: 15
      });
      setLoading(false);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const loadData = async (profData, accessToken) => {
    try {
      // Charger cours
      const coursResponse = await axios.get('http://localhost:3001/cours', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      let coursData = [];
      if (coursResponse.data.success) {
        coursData = coursResponse.data.cours || [];
      }

      const now = new Date();
      const coursAVenir = coursData.filter(c => new Date(c.date) > now);
      const coursFinis = coursData.filter(c => new Date(c.date) <= now && c.statut === 'terminé');
      
      setProchainsCours(coursAVenir.slice(0, 5));
      
      setStats({
        totalCours: coursData.length,
        coursAVenir: coursAVenir.length,
        coursFinis: coursFinis.length,
        evaluations: profData.nombre_avis || 0,
        noteMoyenne: profData.rating_moyen || 0,
        revenus: coursFinis.length * (profData.prix_30min || 15)
      });

      // Charger évaluations
      try {
        const reviewsResponse = await axios.get(`http://localhost:3001/reviews/prof/${profData.id}?limit=3`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (reviewsResponse.data.success) {
          setRecentEvaluations(reviewsResponse.data.reviews || []);
        }
      } catch (reviewError) {
        console.log("⚠️ Pas d'évaluations");
        setRecentEvaluations([]);
      }
      
    } catch (error) {
      console.log("⚠️ Erreur chargement données:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    console.log(`🔄 Changement vers: ${newTab}`);
    setActiveTab(newTab);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StarDisplay = ({ rating, size = 'small' }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''} ${size}`}>
          ⭐
        </span>
      );
    }
    return <div className="stars-display">{stars}</div>;
  };

  if (loading || isCreatingProfile) return (
    <div className="prof-dashboard-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>
          {isCreatingProfile 
            ? "✨ Création de votre profil..." 
            : "Chargement de votre dashboard..."
          }
        </p>
      </div>
    </div>
  );

  if (!session) return <p>Veuillez vous connecter</p>;

  return (
    <div className="prof-dashboard-container">
      
      {/* Bannière nouveau profil */}
      {profProfile && !profProfile.is_validated && (
        <div className="welcome-banner">
          <div className="banner-content">
            <div className="banner-icon">🎉</div>
            <div className="banner-text">
              <h3>Bienvenue sur FirstArabic !</h3>
              <p>Votre profil professeur a été créé.</p>
            </div>
            <div className="banner-action">
              <span className="status-badge">⏳ En attente de validation</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Header avec profil */}
      <div className="dashboard-header">
        <div className="prof-welcome">
          <div className="prof-avatar">
            {profProfile?.photo_url ? (
              <img src={profProfile.photo_url} alt={profProfile.nom} />
            ) : (
              <div className="avatar-placeholder">👨‍🏫</div>
            )}
          </div>
          <div className="welcome-text">
            <h1>🎓 Bienvenue, {profProfile?.nom || 'Professeur'}</h1>
            <p>Connecté : {session.user.email}</p>
            {profProfile?.is_validated ? (
              <span className="validation-badge">✅ Profil validé</span>
            ) : (
              <span className="validation-badge pending">⏳ En attente</span>
            )}
          </div>
        </div>
        
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-value">{stats.noteMoyenne.toFixed(1)}</div>
            <div className="stat-label">⭐ Note moyenne</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.evaluations}</div>
            <div className="stat-label">📝 Évaluations</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.revenus}€</div>
            <div className="stat-label">💰 Revenus</div>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          📊 Tableau de bord
        </button>
        <button 
          className={`tab-button ${activeTab === 'disponibilites' ? 'active' : ''}`}
          onClick={() => handleTabChange('disponibilites')}
        >
          🗓️ Mes disponibilités
        </button>
        <button 
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => handleTabChange('reservations')}
        >
          📋 Demandes de cours
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'dashboard' && (
        <div className="tab-content">
          {/* Statistiques */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalCours}</div>
                <div className="stat-title">Cours donnés</div>
                <div className="stat-subtitle">Au total</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.coursAVenir}</div>
                <div className="stat-title">Cours à venir</div>
                <div className="stat-subtitle">Cette semaine</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.coursFinis}</div>
                <div className="stat-title">Cours terminés</div>
                <div className="stat-subtitle">Ce mois-ci</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">{new Set(prochainsCours.map(c => c.eleve_id)).size}</div>
                <div className="stat-title">Élèves actifs</div>
                <div className="stat-subtitle">Unique</div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="quick-actions">
            <h3>🚀 Actions rapides</h3>
            <div className="actions-grid">
              <button 
                className="action-card"
                onClick={() => handleTabChange('disponibilites')}
              >
                <div className="action-icon">🗓️</div>
                <div className="action-title">Gérer mes disponibilités</div>
                <div className="action-subtitle">Configurer vos créneaux</div>
              </button>
              
              <button 
                className="action-card"
                onClick={() => handleTabChange('reservations')}
              >
                <div className="action-icon">📋</div>
                <div className="action-title">Voir les demandes</div>
                <div className="action-subtitle">Cours en attente</div>
              </button>
              
              <div className="action-card disabled">
                <div className="action-icon">👤</div>
                <div className="action-title">Modifier mon profil</div>
                <div className="action-subtitle">Bientôt disponible</div>
              </div>
              
              <div className="action-card disabled">
                <div className="action-icon">💰</div>
                <div className="action-title">Mes revenus</div>
                <div className="action-subtitle">Bientôt disponible</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="dashboard-footer">
            <div className="help-section">
              <h4>💡 Conseils</h4>
              <ul>
                <li>Définissez vos disponibilités régulièrement</li>
                <li>Soyez ponctuel pour vos cours</li>
                <li>Encouragez vos élèves à laisser des avis</li>
              </ul>
            </div>
            
            <button onClick={handleLogout} className="logout-btn">
              🚪 Se déconnecter
            </button>
          </div>
        </div>
      )}

      {/* Onglet Disponibilités */}
      {activeTab === 'disponibilites' && (
        <div className="tab-content">
          <AvailabilityManagement />
        </div>
      )}

      {/* Onglet Réservations */}
      {activeTab === 'reservations' && (
        <div className="tab-content">
          <ReservationsDashboard token={token} />
        </div>
      )}
    </div>
  );
}

export default ProfDashboard;
