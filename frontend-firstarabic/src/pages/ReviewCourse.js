// src/pages/ReviewCourse.js - Interface d'évaluation d'un cours
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import './ReviewCourse.css';

function ReviewCourse() {
  const { coursId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [cours, setCours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // États du formulaire d'évaluation
  const [rating, setRating] = useState(0);
  const [pedagogieRating, setPedagogieRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [ponctualiteRating, setPonctualiteRating] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [isPublic, setIsPublic] = useState(true);

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

  // Récupération des détails du cours
  useEffect(() => {
    const fetchCoursDetails = async () => {
      if (!token || !coursId) return;

      try {
        // Récupérer les cours qu'on peut évaluer
        const response = await axios.get('http://localhost:3001/reviews/can-review', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const coursToReview = response.data.cours_to_review.find(c => c.id.toString() === coursId);
          if (coursToReview) {
            setCours(coursToReview);
          } else {
            setError("Ce cours ne peut pas être évalué ou a déjà été évalué");
          }
        }
      } catch (err) {
        console.error("Erreur récupération cours:", err);
        setError("Erreur lors du chargement du cours");
      } finally {
        setLoading(false);
      }
    };

    fetchCoursDetails();
  }, [token, coursId]);

  // Fonction pour afficher les étoiles
  const StarRating = ({ rating, setRating, label, disabled = false }) => {
    return (
      <div className="star-rating">
        <label className="rating-label">{label}</label>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star ${star <= rating ? 'filled' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && setRating(star)}
              disabled={disabled}
            >
              ⭐
            </button>
          ))}
        </div>
        <span className="rating-text">
          {rating === 0 ? 'Non noté' : `${rating}/5 étoile${rating > 1 ? 's' : ''}`}
        </span>
      </div>
    );
  };

  // Soumission de l'évaluation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Veuillez donner une note générale au cours");
      return;
    }

    setSubmitting(true);

    try {
      const reviewData = {
        cours_id: parseInt(coursId),
        rating,
        commentaire: commentaire.trim() || null,
        pedagogie_rating: pedagogieRating || null,
        communication_rating: communicationRating || null,
        ponctualite_rating: ponctualiteRating || null,
        is_public: isPublic
      };

      const response = await axios.post('http://localhost:3001/reviews', reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert("✅ Évaluation envoyée avec succès ! Merci pour votre retour.");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Erreur soumission évaluation:", err);
      const errorMessage = err.response?.data?.message || "Erreur lors de l'envoi de l'évaluation";
      alert(`❌ ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="review-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement du cours...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="review-container">
      <div className="error-state">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn-secondary">← Retour au dashboard</Link>
      </div>
    </div>
  );

  if (!cours) return (
    <div className="review-container">
      <div className="error-state">
        <h2>⚠️ Cours non trouvé</h2>
        <p>Ce cours ne peut pas être évalué.</p>
        <Link to="/dashboard" className="btn-secondary">← Retour au dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="review-container">
      
      {/* Header */}
      <div className="review-header">
        <h1>⭐ Évaluer votre cours</h1>
        <p>Votre avis nous aide à améliorer la qualité des cours</p>
      </div>

      {/* Informations du cours */}
      <div className="course-info">
        <div className="course-card">
          <div className="professor-info">
            <div className="professor-avatar">
              {cours.profs?.photo_url ? (
                <img src={cours.profs.photo_url} alt={cours.profs.nom} />
              ) : (
                <div className="avatar-placeholder">👨‍🏫</div>
              )}
            </div>
            <div className="course-details">
              <h3>Cours avec {cours.profs?.nom}</h3>
              <div className="course-date">
                📅 {new Date(cours.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="course-status">
                🏁 Statut: {cours.statut}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'évaluation */}
      <form onSubmit={handleSubmit} className="review-form">
        
        {/* Note générale */}
        <div className="rating-section">
          <h3>📊 Évaluation générale</h3>
          <StarRating 
            rating={rating} 
            setRating={setRating} 
            label="Note générale du cours *" 
          />
        </div>

        {/* Notes détaillées */}
        <div className="rating-section">
          <h3>🔍 Évaluation détaillée (optionnel)</h3>
          <div className="detailed-ratings">
            <StarRating 
              rating={pedagogieRating} 
              setRating={setPedagogieRating} 
              label="Pédagogie" 
            />
            <StarRating 
              rating={communicationRating} 
              setRating={setCommunicationRating} 
              label="Communication" 
            />
            <StarRating 
              rating={ponctualiteRating} 
              setRating={setPonctualiteRating} 
              label="Ponctualité" 
            />
          </div>
        </div>

        {/* Commentaire */}
        <div className="comment-section">
          <h3>💬 Votre avis (optionnel)</h3>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Partagez votre expérience avec ce professeur. Qu'avez-vous aimé ? Que pourrait-il améliorer ?"
            maxLength={1000}
            rows={4}
          />
          <div className="character-count">
            {commentaire.length}/1000 caractères
          </div>
        </div>

        {/* Options de confidentialité */}
        <div className="privacy-section">
          <label className="privacy-option">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span>Publier cet avis publiquement (votre nom sera partiellement masqué)</span>
          </label>
          <p className="privacy-note">
            Si vous décochez cette option, seul le professeur pourra voir votre avis.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
            disabled={submitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting || rating === 0}
          >
            {submitting ? '⏳ Envoi...' : '✅ Publier mon évaluation'}
          </button>
        </div>
      </form>

      {/* Aide */}
      <div className="help-section">
        <h4>💡 Conseils pour une bonne évaluation</h4>
        <ul>
          <li>Soyez honnête et constructif dans vos commentaires</li>
          <li>Mentionnez ce qui vous a plu et ce qui pourrait être amélioré</li>
          <li>Vos avis aident d'autres élèves à choisir leur professeur</li>
          <li>Restez respectueux, même si l'expérience n'était pas parfaite</li>
        </ul>
      </div>
    </div>
  );
}

export default ReviewCourse;
