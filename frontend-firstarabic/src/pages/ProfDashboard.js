// src/pages/ProfDashboard.js - VERSION avec AUTO-CRÉATION de profil
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";
import './ProfDashboard.css';

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
  const [isCreatingProfile, setIsCreatingProfile] = useState(false); // 🆕 État de création

  // Récupération de la session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setToken(session.access_token);
      }
    });
  }, []);

  // Récupération des données du professeur
  useEffect(() => {
    const fetchProfData = async () => {
      if (!token) return;

      try {
        // 1. Récupérer le profil du prof
        console.log("🔍 Récupération profil professeur...");
        const profResponse = await axios.get('http://localhost:3001/profs/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (profResponse.data.success && profResponse.data.prof) {
          console.log("✅ Profil professeur récupéré:", profResponse.data.prof);
          setProfProfile(profResponse.data.prof);
          await loadCoursesAndReviews(profResponse.data.prof);
          
        } else if (profResponse.data.success && !profResponse.data.prof) {
          // 🆕 AUCUN PROFIL TROUVÉ - Auto-création
          console.log("🆕 Aucun profil trouvé, création automatique...");
          await createProfesseurProfile();
          
        } else {
          console.log("❌ Erreur récupération profil:", profResponse.data);
          throw new Error("Erreur récupération profil");
        }
        
      } catch (err) {
        console.error("❌ Erreur récupération données prof:", err);
        // 🆕 En cas d'erreur 404, tenter la création automatique
        if (err.response?.status === 404 || err.response?.status === 401) {
          console.log("🔧 Tentative de création automatique suite à erreur...");
          await createProfesseurProfile();
        }
      } finally {
        setLoading(false);
        setIsCreatingProfile(false);
      }
    };

    // 🆕 Fonction pour créer automatiquement un profil professeur
    const createProfesseurProfile = async () => {
      if (isCreatingProfile) return; // Éviter les appels multiples
      
      setIsCreatingProfile(true);
      console.log("🛠️ Création automatique du profil professeur...");
      
      try {
        // Extraire le nom depuis les métadonnées ou l'email
        const userMetadata = session?.user?.user_metadata || {};
        const email = session?.user?.email || '';
        
        const nom = userMetadata.full_name || 
                   userMetadata.name || 
                   email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') || 
                   'Professeur';

        const profileData = {
          nom: nom,
          specialite: 'Arabe général',
          bio: `Professeur d'arabe passionné. Rejoint FirstArabic pour partager ses connaissances et aider les élèves à maîtriser la langue arabe.`,
          specialites: ['Arabe général', 'Conversation'],
          langues_parlees: ['Arabe', 'Français'],
          prix_30min: 15.00,
          prix_60min: 25.00,
          experience_annees: 1,
          pays_origine: 'Maroc',
          disponible_maintenant: false
        };

        console.log("📤 Données profil à créer:", profileData);

        const createResponse = await axios.post('http://localhost:3001/profs', profileData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (createResponse.data.success && createResponse.data.prof) {
          console.log("✅ Profil professeur créé automatiquement:", createResponse.data.prof);
          setProfProfile(createResponse.data.prof);
          
          // Charger les données liées (cours et avis) - seront vides mais structure prête
          await loadCoursesAndReviews(createResponse.data.prof);
          
          // Message de succès (optionnel)
          console.log("🎉 Bienvenue ! Votre profil professeur a été créé automatiquement.");
          
        } else {
          console.error("❌ Échec création profil:", createResponse.data);
          throw new Error("Échec création profil automatique");
        }
        
      } catch (createError) {
        console.error("❌ Erreur création profil automatique:", createError);
        
        // Fallback : afficher un message d'erreur mais ne pas bloquer l'interface
        setStats({
          totalCours: 0,
          coursAVenir: 0,
          coursFinis: 0,
          evaluations: 0,
          noteMoyenne: 0,
          revenus: 0
        });
        
        // Profil minimal pour éviter les erreurs d'affichage
        setProfProfile({
          nom: session?.user?.email?.split('@')[0] || 'Professeur',
          email: session?.user?.email,
          is_validated: false,
          rating_moyen: 0,
          nombre_avis: 0,
          prix_30min: 15
        });
      }
    };

    // 🔄 Fonction pour charger cours et évaluations
    const loadCoursesAndReviews = async (profData) => {
      // 2. Récupérer les cours du prof
      try {
        console.log("🔍 Récupération des cours du prof...");
        const coursResponse = await axios.get('http://localhost:3001/cours', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (coursResponse.data.success) {
          const cours = coursResponse.data.cours || [];
          console.log("✅ Cours récupérés:", cours.length);
          
          // Calculer les statistiques
          const now = new Date();
          const coursAVenir = cours.filter(c => new Date(c.date) > now);
          const coursFinis = cours.filter(c => new Date(c.date) <= now && c.statut === 'terminé');
          
          setProchainsCours(coursAVenir.slice(0, 5));
          
          setStats({
            totalCours: cours.length,
            coursAVenir: coursAVenir.length,
            coursFinis: coursFinis.length,
            evaluations: profData.nombre_avis || 0,
            noteMoyenne: profData.rating_moyen || 0,
            revenus: coursFinis.length * (profData.prix_30min || 15)
          });
        } else {
          console.log("⚠️ Pas de cours trouvés, utilisation des données par défaut");
          setProchainsCours([]);
          setStats({
            totalCours: 0,
            coursAVenir: 0,
            coursFinis: 0,
            evaluations: profData.nombre_avis || 0,
            noteMoyenne: profData.rating_moyen || 0,
            revenus: 0
          });
        }
      } catch (coursError) {
        console.log("⚠️ Erreur récupération cours:", coursError.message);
        setProchainsCours([]);
        setStats({
          totalCours: 0,
          coursAVenir: 0,
          coursFinis: 0,
          evaluations: profData.nombre_avis || 0,
          noteMoyenne: profData.rating_moyen || 0,
          revenus: 0
        });
      }

      // 3. Récupérer les évaluations récentes
      try {
        console.log("🔍 Récupération des évaluations...");
        const reviewsResponse = await axios.get(`http://localhost:3001/reviews/prof/${profData.id}?limit=3`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (reviewsResponse.data.success) {
          console.log("✅ Évaluations récupérées:", reviewsResponse.data.reviews.length);
          setRecentEvaluations(reviewsResponse.data.reviews || []);
        } else {
          console.log("⚠️ Pas d'évaluations trouvées");
          setRecentEvaluations([]);
        }
      } catch (reviewError) {
        console.log("⚠️ Erreur récupération évaluations:", reviewError.message);
        setRecentEvaluations([]);
      }
    };

    fetchProfData();
  }, [token, session]); // 🆕 Ajout de session dans les dépendances

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour afficher les étoiles
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

  // 🆕 État de chargement amélioré
  if (loading || isCreatingProfile) return (
    <div className="prof-dashboard-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>
          {isCreatingProfile 
            ? "✨ Création de votre profil professeur..." 
            : "Chargement de votre dashboard..."
          }
        </p>
        {isCreatingProfile && (
          <p style={{marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8}}>
            Première connexion détectée, initialisation en cours...
          </p>
        )}
      </div>
    </div>
  );

  if (!session) return <p>Veuillez vous connecter</p>;

  return (
    <div className="prof-dashboard-container">
      
      {/* 🆕 Bannière nouveau profil */}
      {profProfile && !profProfile.is_validated && (
        <div className="welcome-banner">
          <div className="banner-content">
            <div className="banner-icon">🎉</div>
            <div className="banner-text">
              <h3>Bienvenue sur FirstArabic !</h3>
              <p>Votre profil professeur a été créé. Il sera visible par les élèves après validation par notre équipe.</p>
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
              <span className="validation-badge pending">⏳ En attente de validation</span>
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

      {/* Statistiques détaillées */}
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
          {/* TEMPORAIRE - Liens désactivés en attendant les pages */}
          <div className="action-card disabled">
            <div className="action-icon">🗓️</div>
            <div className="action-title">Gérer mes disponibilités</div>
            <div className="action-subtitle">Bientôt disponible</div>
          </div>
          
          <div className="action-card disabled">
            <div className="action-icon">👤</div>
            <div className="action-title">Modifier mon profil</div>
            <div className="action-subtitle">Bientôt disponible</div>
          </div>
          
          <div className="action-card disabled">
            <div className="action-icon">👁️</div>
            <div className="action-title">Voir mon profil public</div>
            <div className="action-subtitle">Bientôt disponible</div>
          </div>
          
          <div className="action-card disabled">
            <div className="action-icon">💰</div>
            <div className="action-title">Mes revenus</div>
            <div className="action-subtitle">Bientôt disponible</div>
          </div>
        </div>
      </div>

      {/* Prochains cours */}
      <div className="upcoming-courses">
        <div className="section-header">
          <h3>📅 Mes prochains cours</h3>
          <Link to="/planning" className="view-all">Voir tout →</Link>
        </div>
        
        {prochainsCours.length === 0 ? (
          <div className="empty-state">
            <p>📭 Aucun cours programmé pour le moment</p>
            <p>Vos prochains cours apparaîtront ici automatiquement</p>
          </div>
        ) : (
          <div className="courses-list">
            {prochainsCours.map((cours) => (
              <div key={cours.id} className="course-card">
                <div className="course-time">
                  <div className="course-date">{formatDate(cours.date)}</div>
                  <div className="course-status">{cours.statut}</div>
                </div>
                <div className="course-details">
                  <div className="student-name">👤 {cours.eleves?.nom || cours.eleve_nom || 'Élève'}</div>
                  <div className="course-link">
                    {cours.jitsi_url && (
                      <a href={cours.jitsi_url} target="_blank" rel="noopener noreferrer" className="join-link">
                        🎥 Rejoindre le cours
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Évaluations récentes */}
      <div className="recent-reviews">
        <div className="section-header">
          <h3>⭐ Évaluations récentes</h3>
          {/* TEMPORAIRE - Lien désactivé */}
          <span className="view-all disabled">Bientôt disponible</span>
        </div>
        
        {recentEvaluations.length === 0 ? (
          <div className="empty-state">
            <p>📝 {stats.evaluations > 0 ? 'Évaluations bientôt visibles' : 'Aucune évaluation pour le moment'}</p>
            <p>{stats.evaluations > 0 ? `Vous avez ${stats.evaluations} évaluation(s) avec une note moyenne de ${stats.noteMoyenne.toFixed(1)}/5` : 'Les avis de vos élèves apparaîtront ici'}</p>
          </div>
        ) : (
          <div className="reviews-list">
            {recentEvaluations.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="student-info">
                    <strong>{review.eleve_nom_anonyme || review.eleve_nom || 'Élève'}</strong>
                    <StarDisplay rating={review.rating} />
                  </div>
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                {review.commentaire && (
                  <div className="review-comment">
                    "{review.commentaire}"
                  </div>
                )}
                <div className="review-details">
                  {review.pedagogie_rating && (
                    <span className="detail-rating">Pédagogie: {review.pedagogie_rating}/5</span>
                  )}
                  {review.communication_rating && (
                    <span className="detail-rating">Communication: {review.communication_rating}/5</span>
                  )}
                  {review.ponctualite_rating && (
                    <span className="detail-rating">Ponctualité: {review.ponctualite_rating}/5</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="dashboard-footer">
        <div className="help-section">
          <h4>💡 Conseils pour réussir</h4>
          <ul>
            <li>Maintenez un profil à jour avec photo et bio attractive</li>
            <li>Définissez vos disponibilités régulièrement</li>
            <li>Soyez ponctuel et préparez vos cours à l'avance</li>
            <li>Encouragez vos élèves à laisser des avis positifs</li>
          </ul>
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default ProfDashboard;
