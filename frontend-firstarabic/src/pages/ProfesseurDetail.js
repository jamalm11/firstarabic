// src/pages/ProfesseurDetail.js - Page de profil détaillé du professeur
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import './ProfesseurDetail.css';

function ProfesseurDetail() {
  const { id } = useParams(); // ID du professeur dans l'URL
  const navigate = useNavigate();
  const [professor, setProfessor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  // Récupérer les données du professeur et ses avis
  useEffect(() => {
    const fetchProfessorData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Veuillez vous connecter");
          return;
        }

        console.log("🔍 Récupération données prof ID:", id);

        // 1. Récupérer les infos du professeur
        const profResponse = await axios.get('http://localhost:3001/profs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (profResponse.data.success) {
          const foundProf = profResponse.data.profs.find(p => p.id === id);
          if (!foundProf) {
            setError("Professeur non trouvé");
            return;
          }
          console.log("✅ Professeur trouvé:", foundProf);
          setProfessor(foundProf);
        }

        // 2. Récupérer les avis du professeur
        try {
          const reviewsResponse = await axios.get(`http://localhost:3001/reviews/prof/${id}?limit=10&offset=0`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });

          if (reviewsResponse.data.success) {
            console.log("✅ Avis récupérés:", reviewsResponse.data.reviews.length);
            setReviews(reviewsResponse.data.reviews);
            setStats(reviewsResponse.data.stats);
            setHasMoreReviews(reviewsResponse.data.pagination?.has_more || false);
          }
        } catch (reviewError) {
          console.log("⚠️ Erreur récupération avis:", reviewError.message);
          setReviews([]);
        }

      } catch (err) {
        console.error("❌ Erreur récupération données:", err);
        setError("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfessorData();
    }
  }, [id]);

  // Fonction pour charger plus d'avis
  const loadMoreReviews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const nextPage = reviewsPage + 1;
      
      const response = await axios.get(`http://localhost:3001/reviews/prof/${id}?limit=10&offset=${nextPage * 10}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.data.success && response.data.reviews.length > 0) {
        setReviews(prev => [...prev, ...response.data.reviews]);
        setReviewsPage(nextPage);
        setHasMoreReviews(response.data.pagination?.has_more || false);
      } else {
        setHasMoreReviews(false);
      }
    } catch (err) {
      console.error("Erreur chargement avis supplémentaires:", err);
    }
  };

  // Fonction pour afficher les étoiles
  const StarDisplay = ({ rating, size = 'normal', showNumber = false }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className={`star filled ${size}`}>⭐</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className={`star half ${size}`}>⭐</span>);
      } else {
        stars.push(<span key={i} className={`star empty ${size}`}>☆</span>);
      }
    }
    
    return (
      <div className="stars-display">
        {stars}
        {showNumber && <span className="rating-number">({rating.toFixed(1)})</span>}
      </div>
    );
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour calculer le temps depuis dernière connexion
  const getLastSeenText = (lastConnection) => {
    if (!lastConnection) return 'Jamais connecté';
    
    const now = new Date();
    const last = new Date(lastConnection);
    const diffMinutes = Math.round((now - last) / (1000 * 60));
    
    if (diffMinutes < 5) return 'En ligne maintenant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.round(diffMinutes / 60)}h`;
    return `Il y a ${Math.round(diffMinutes / 1440)} jour(s)`;
  };

  if (loading) return (
    <div className="professor-detail-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="professor-detail-container">
      <div className="error-state">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <Link to="/professeurs" className="btn-secondary">← Retour aux professeurs</Link>
      </div>
    </div>
  );

  if (!professor) return (
    <div className="professor-detail-container">
      <div className="error-state">
        <h2>❌ Professeur non trouvé</h2>
        <Link to="/professeurs" className="btn-secondary">← Retour aux professeurs</Link>
      </div>
    </div>
  );

  return (
    <div className="professor-detail-container">
      
      {/* Navigation */}
      <div className="breadcrumb">
        <Link to="/professeurs">Professeurs</Link>
        <span>›</span>
        <span>{professor.nom}</span>
      </div>

      {/* Header avec profil principal */}
      <div className="professor-header">
        <div className="professor-main-info">
          <div className="professor-avatar-large">
            {professor.photo_url ? (
              <img src={professor.photo_url} alt={professor.nom} />
            ) : (
              <div className="avatar-placeholder">👨‍🏫</div>
            )}
            
            {/* Badge statut en ligne */}
            {(professor.disponible_maintenant || professor.is_online) && (
              <div className="online-indicator">
                <div className="online-dot"></div>
                En ligne
              </div>
            )}
          </div>

          <div className="professor-info">
            <h1>{professor.nom}</h1>
            
            {/* Stats principales */}
            <div className="main-stats">
              <div className="stat-item">
                <StarDisplay rating={professor.rating_moyen || 4.5} size="large" showNumber />
              </div>
              <div className="stat-item">
                <span className="stat-number">{professor.nombre_avis || 0}</span>
                <span className="stat-label">avis</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{professor.experience_annees || 1}+</span>
                <span className="stat-label">ans d'expérience</span>
              </div>
            </div>

            {/* Prix et action */}
            <div className="price-and-action">
              <div className="price-display">
                <span className="price-amount">{professor.prix_30min || 15}€</span>
                <span className="price-duration">/ 30 min</span>
              </div>
              <Link
                to={`/reservation?prof_id=${professor.id}`}
                className="btn-book-now"
              >
                📅 Réserver maintenant
              </Link>
            </div>

            {/* Dernière connexion */}
            {professor.derniere_connexion && (
              <div className="last-seen">
                🕒 {getLastSeenText(professor.derniere_connexion)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section informations détaillées */}
      <div className="professor-details-grid">
        
        {/* Colonne gauche - Infos */}
        <div className="professor-left-column">
          
          {/* Bio */}
          {professor.bio && (
            <div className="info-section">
              <h3>📝 À propos</h3>
              <p className="bio-text">{professor.bio}</p>
            </div>
          )}

          {/* Spécialités */}
          <div className="info-section">
            <h3>🎯 Spécialités</h3>
            <div className="specialties-list">
              {(professor.specialites || [professor.specialite]).filter(Boolean).map((spec, index) => (
                <span key={index} className="specialty-chip">{spec}</span>
              ))}
            </div>
          </div>

          {/* Langues */}
          <div className="info-section">
            <h3>🌍 Langues parlées</h3>
            <div className="languages-list">
              {(professor.langues_parlees || ['Arabe']).map((lang, index) => (
                <span key={index} className="language-chip">{lang}</span>
              ))}
            </div>
          </div>

          {/* Pays d'origine */}
          {professor.pays_origine && (
            <div className="info-section">
              <h3>📍 Pays d'origine</h3>
              <p>{professor.pays_origine}</p>
            </div>
          )}

          {/* Vidéo d'introduction */}
          {professor.video_intro_url && (
            <div className="info-section">
              <h3>🎥 Vidéo d'introduction</h3>
              <div className="video-container">
                <video controls width="100%">
                  <source src={professor.video_intro_url} type="video/mp4" />
                  Votre navigateur ne supporte pas la vidéo.
                </video>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite - Avis */}
        <div className="professor-right-column">
          
          {/* Statistiques des avis */}
          {stats && stats.rating_moyen > 0 && (
            <div className="reviews-stats">
              <h3>📊 Statistiques des avis</h3>
              <div className="stats-grid">
                <div className="stat-row">
                  <span className="stat-label">Note générale</span>
                  <div className="stat-value">
                    <StarDisplay rating={stats.rating_moyen} />
                    <span>{stats.rating_moyen.toFixed(1)}</span>
                  </div>
                </div>
                {stats.rating_pedagogie && (
                  <div className="stat-row">
                    <span className="stat-label">Pédagogie</span>
                    <div className="stat-value">
                      <StarDisplay rating={stats.rating_pedagogie} />
                      <span>{stats.rating_pedagogie.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {stats.rating_communication && (
                  <div className="stat-row">
                    <span className="stat-label">Communication</span>
                    <div className="stat-value">
                      <StarDisplay rating={stats.rating_communication} />
                      <span>{stats.rating_communication.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {stats.rating_ponctualite && (
                  <div className="stat-row">
                    <span className="stat-label">Ponctualité</span>
                    <div className="stat-value">
                      <StarDisplay rating={stats.rating_ponctualite} />
                      <span>{stats.rating_ponctualite.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste des avis */}
          <div className="reviews-section">
            <h3>💬 Avis des élèves ({reviews.length})</h3>
            
            {reviews.length === 0 ? (
              <div className="no-reviews">
                <p>📝 Aucun avis pour le moment</p>
                <p>Soyez le premier à laisser un avis sur ce professeur !</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {review.eleve_nom ? review.eleve_nom.charAt(0).toUpperCase() : 'É'}
                        </div>
                        <div className="reviewer-details">
                          <span className="reviewer-name">{review.eleve_nom_anonyme || 'Élève vérifié'}</span>
                          <span className="review-date">{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                      <StarDisplay rating={review.rating} />
                    </div>
                    
                    {review.commentaire && (
                      <div className="review-comment">
                        <p>"{review.commentaire}"</p>
                      </div>
                    )}
                    
                    {(review.pedagogie_rating || review.communication_rating || review.ponctualite_rating) && (
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
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bouton charger plus */}
            {hasMoreReviews && (
              <button onClick={loadMoreReviews} className="load-more-btn">
                Voir plus d'avis
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Call-to-action fixe en bas */}
      <div className="bottom-cta">
        <div className="cta-content">
          <div className="cta-info">
            <span className="cta-price">{professor.prix_30min || 15}€ / 30 min</span>
            <StarDisplay rating={professor.rating_moyen || 4.5} showNumber />
          </div>
          <Link
            to={`/reservation?prof_id=${professor.id}`}
            className="cta-book-btn"
          >
            📅 Réserver un cours avec {professor.nom}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProfesseurDetail;
