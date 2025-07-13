// src/pages/MyReviews.js - Page pour voir ses évaluations
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import './MyReviews.css';

function MyReviews() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Récupération de la session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setSession(session);
      setToken(session.access_token);
    };
    getSession();
  }, [navigate]);

  // Récupération des évaluations
  useEffect(() => {
    const fetchMyReviews = async () => {
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:3001/reviews/my-reviews', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setMyReviews(response.data.my_reviews);
        }
      } catch (err) {
        console.error("Erreur récupération mes évaluations:", err);
        setError("Erreur lors du chargement de vos évaluations");
      } finally {
        setLoading(false);
      }
    };

    fetchMyReviews();
  }, [token]);

  // Fonction pour afficher les étoiles
  const StarDisplay = ({ rating, label }) => {
    if (!rating) return null;
    
    return (
      <div className="star-display">
        <span className="star-label">{label}:</span>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
              ⭐
            </span>
          ))}
        </div>
        <span className="star-count">({rating}/5)</span>
      </div>
    );
  };

  // Fonction pour supprimer une évaluation
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Recharger les évaluations
      setMyReviews(myReviews.filter(review => review.id !== reviewId));
      alert("✅ Évaluation supprimée avec succès");
    } catch (err) {
      console.error("Erreur suppression évaluation:", err);
      alert("❌ Erreur lors de la suppression");
    }
  };

  if (loading) return (
    <div className="my-reviews-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement de vos évaluations...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="my-reviews-container">
      <div className="error-state">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn-secondary">← Retour au dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="my-reviews-container">
      
      {/* Header */}
      <div className="reviews-header">
        <h1>📝 Mes Évaluations</h1>
        <p>Consultez et gérez vos avis sur les cours suivis</p>
        <Link to="/dashboard" className="back-link">← Retour au dashboard</Link>
      </div>

      {/* Statistiques rapides */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{myReviews.length}</div>
          <div className="stat-label">Cours évalués</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {myReviews.length > 0 
              ? (myReviews.reduce((acc, r) => acc + r.rating, 0) / myReviews.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="stat-label">Note moyenne donnée</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{myReviews.filter(r => r.is_public).length}</div>
          <div className="stat-label">Avis publics</div>
        </div>
      </div>

      {/* Liste des évaluations */}
      {myReviews.length === 0 ? (
        <div className="no-reviews">
          <div className="no-reviews-icon">📝</div>
          <h3>Aucune évaluation pour le moment</h3>
          <p>Vos évaluations de cours apparaîtront ici une fois que vous aurez donné votre avis.</p>
          <Link to="/dashboard" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
      ) : (
        <div className="reviews-list">
          {myReviews.map((review) => (
            <div key={review.id} className="review-card">
              
              {/* Header de la carte */}
              <div className="review-header">
                <div className="professor-info">
                  <div className="professor-avatar">
                    {review.profs?.photo_url ? (
                      <img src={review.profs.photo_url} alt={review.profs.nom} />
                    ) : (
                      <div className="avatar-placeholder">👨‍🏫</div>
                    )}
                  </div>
                  <div className="professor-details">
                    <h3>Cours avec {review.profs?.nom}</h3>
                    <div className="course-date">
                      📅 {new Date(review.cours?.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="review-status">
                  {review.is_public ? (
                    <span className="status-public">🌍 Public</span>
                  ) : (
                    <span className="status-private">🔒 Privé</span>
                  )}
                </div>
              </div>

              {/* Évaluations */}
              <div className="review-content">
                <div className="ratings-section">
                  <StarDisplay rating={review.rating} label="Note générale" />
                  {review.pedagogie_rating && (
                    <StarDisplay rating={review.pedagogie_rating} label="Pédagogie" />
                  )}
                  {review.communication_rating && (
                    <StarDisplay rating={review.communication_rating} label="Communication" />
                  )}
                  {review.ponctualite_rating && (
                    <StarDisplay rating={review.ponctualite_rating} label="Ponctualité" />
                  )}
                </div>

                {review.commentaire && (
                  <div className="comment-section">
                    <h4>💬 Votre commentaire :</h4>
                    <p className="comment-text">"{review.commentaire}"</p>
                  </div>
                )}
              </div>

              {/* Footer avec actions */}
              <div className="review-footer">
                <div className="review-date">
                  Évalué le {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  {review.updated_at !== review.created_at && (
                    <span className="updated-note">
                      (modifié le {new Date(review.updated_at).toLocaleDateString('fr-FR')})
                    </span>
                  )}
                </div>
                
                <div className="review-actions">
                  <button 
                    onClick={() => handleDeleteReview(review.id)}
                    className="btn-delete"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Call to action */}
      {myReviews.length > 0 && (
        <div className="cta-section">
          <h3>🌟 Continuez à partager vos expériences !</h3>
          <p>Vos avis aident d'autres élèves à choisir le bon professeur.</p>
          <Link to="/dashboard" className="btn-primary">
            Voir les cours à évaluer
          </Link>
        </div>
      )}
    </div>
  );
}

export default MyReviews;
