// src/pages/Professeurs.js - VERSION ENRICHIE avec réservation
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import './Professeurs.css';

// 🆕 Import du composant de réservation
import BookingInterface from '../components/BookingInterface';

function Professeurs() {
  const [professors, setProfessors] = useState([]);
  const [filteredProfs, setFilteredProfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États des filtres (vos filtres existants)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('rating'); // rating, price, experience
  const [minRating, setMinRating] = useState(0); // Nouveau filtre par note

  // 🆕 États pour la réservation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProfForBooking, setSelectedProfForBooking] = useState(null);
  const [userSession, setUserSession] = useState(null);

  // 🆕 Récupérer la session utilisateur
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserSession(session);
    };
    getSession();
  }, []);

  // Récupérer session et professeurs (votre code existant adapté)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Veuillez vous connecter");
          return;
        }

        console.log("🔍 Récupération des professeurs...");
        const response = await axios.get('http://localhost:3001/profs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        console.log("✅ Professeurs reçus:", response.data);
        if (response.data.success) {
          setProfessors(response.data.profs);
          setFilteredProfs(response.data.profs);
        }
      } catch (err) {
        console.error("❌ Erreur récupération professeurs:", err);
        setError("Erreur lors du chargement des professeurs");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Appliquer les filtres (votre logique existante + nouveau filtre note)
  useEffect(() => {
    let filtered = [...professors];

    // Recherche par nom
    if (searchTerm) {
      filtered = filtered.filter(prof => 
        prof.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par spécialité
    if (selectedSpecialty) {
      filtered = filtered.filter(prof => 
        prof.specialites?.includes(selectedSpecialty) ||
        prof.specialite === selectedSpecialty
      );
    }

    // Filtre par langue
    if (selectedLanguage) {
      filtered = filtered.filter(prof => 
        prof.langues_parlees?.includes(selectedLanguage)
      );
    }

    // Filtre par prix
    filtered = filtered.filter(prof => {
      const prix = prof.prix_30min || 15;
      return prix >= priceRange[0] && prix <= priceRange[1];
    });

    // Filtre par note minimum
    if (minRating > 0) {
      filtered = filtered.filter(prof => (prof.rating_moyen || 0) >= minRating);
    }

    // Filtre disponibles maintenant
    if (onlyAvailable) {
      filtered = filtered.filter(prof => prof.disponible_maintenant || prof.is_online);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.prix_30min || 15) - (b.prix_30min || 15);
        case 'experience':
          return (b.experience_annees || 1) - (a.experience_annees || 1);
        case 'reviews':
          return (b.nombre_avis || 0) - (a.nombre_avis || 0);
        case 'rating':
        default:
          return (b.rating_moyen || 4.5) - (a.rating_moyen || 4.5);
      }
    });

    setFilteredProfs(filtered);
  }, [professors, searchTerm, selectedSpecialty, selectedLanguage, priceRange, onlyAvailable, sortBy, minRating]);

  // 🆕 Fonction pour ouvrir la modal de réservation
  const handleBookingClick = (prof) => {
    if (!userSession) {
      alert('Veuillez vous connecter pour réserver un cours');
      return;
    }
    setSelectedProfForBooking(prof);
    setShowBookingModal(true);
  };

  // 🆕 Fonction pour fermer la modal
  const handleCloseBooking = () => {
    setShowBookingModal(false);
    setSelectedProfForBooking(null);
  };

  // 🆕 Vérifier si l'utilisateur est un élève
  const isStudent = () => {
    return userSession?.user?.user_metadata?.role === 'eleve' || 
           userSession?.user?.user_metadata?.role !== 'prof';
  };

  // Extraire toutes les spécialités uniques
  const allSpecialties = [...new Set(
    professors.flatMap(prof => prof.specialites || [prof.specialite]).filter(Boolean)
  )];

  // Extraire toutes les langues uniques
  const allLanguages = [...new Set(
    professors.flatMap(prof => prof.langues_parlees || []).filter(Boolean)
  )];

  // Calculer le temps depuis dernière connexion
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

  // Fonction pour afficher les étoiles
  const StarDisplay = ({ rating, size = 'normal' }) => {
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
    return <div className="stars-display">{stars}</div>;
  };

  // Badge recommandé
  const getRecommendedBadge = (prof) => {
    const rating = prof.rating_moyen || 0;
    const reviews = prof.nombre_avis || 0;
    
    if (rating >= 4.8 && reviews >= 5) {
      return <span className="badge recommended">🏆 Recommandé</span>;
    } else if (rating >= 4.5 && reviews >= 3) {
      return <span className="badge popular">🔥 Populaire</span>;
    } else if (reviews === 0) {
      return <span className="badge new">🆕 Nouveau</span>;
    }
    return null;
  };

  if (loading) return (
    <div className="professors-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des professeurs...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="professors-container">
      <div className="error-state">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="professors-container">
      
      {/* Header */}
      <div className="professors-header">
        <h1>🧑‍🏫 Nos Professeurs d'Arabe</h1>
        <p>Trouvez le professeur idéal pour apprendre l'arabe. Cours individuels en ligne avec des natifs expérimentés.</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="filters-section">
        <div className="filters-grid">
          
          {/* Recherche */}
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Spécialité */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
          >
            <option value="">Toutes spécialités</option>
            {allSpecialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          {/* Langue */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="">Toutes langues</option>
            {allLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          {/* Note minimum */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
          >
            <option value={0}>Toutes notes</option>
            <option value={4.5}>4.5⭐ et +</option>
            <option value={4.0}>4.0⭐ et +</option>
            <option value={3.5}>3.5⭐ et +</option>
          </select>

          {/* Prix max */}
          <select
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
          >
            <option value={50}>Prix max: 50€</option>
            <option value={20}>Max: 20€</option>
            <option value={30}>Max: 30€</option>
            <option value={40}>Max: 40€</option>
          </select>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Tri: Meilleurs notes</option>
            <option value="reviews">Tri: Plus d'avis</option>
            <option value="price">Tri: Prix</option>
            <option value="experience">Tri: Expérience</option>
          </select>
        </div>

        {/* Options additionnelles */}
        <div className="filters-options">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            <span>Disponibles maintenant uniquement</span>
          </label>
          
          <div className="results-count">
            {filteredProfs.length} professeur{filteredProfs.length > 1 ? 's' : ''} trouvé{filteredProfs.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Grille des professeurs */}
      <div className="professors-grid">
        {filteredProfs.map((prof) => (
          <div key={prof.id} className="professor-card">
            
            {/* Photo et statut */}
            <div className="professor-photo">
              {prof.photo_url ? (
                <img src={prof.photo_url} alt={prof.nom} />
              ) : (
                <div className="photo-placeholder">👨‍🏫</div>
              )}
              
              {/* Badge statut en ligne */}
              {(prof.disponible_maintenant || prof.is_online) && (
                <div className="online-badge">
                  <div className="online-dot"></div>
                  En ligne
                </div>
              )}

              {/* Badge vidéo intro */}
              {prof.video_intro_url && (
                <div className="video-badge">
                  🎥 Vidéo
                </div>
              )}
            </div>

            {/* Contenu de la carte */}
            <div className="professor-content">
              
              {/* Header avec badge */}
              <div className="professor-header-card">
                <div className="name-section">
                  <h3>{prof.nom}</h3>
                  {getRecommendedBadge(prof)}
                </div>
                <div className="price-info">
                  <div className="price">{prof.prix_30min || 15}€</div>
                  <div className="duration">30 min</div>
                </div>
              </div>

              {/* Rating et avis enrichis */}
              <div className="professor-stats">
                <div className="rating-section">
                  <StarDisplay rating={prof.rating_moyen || 4.5} />
                  <span className="rating-text">
                    {(prof.rating_moyen || 4.5).toFixed(1)} 
                    ({prof.nombre_avis || 0} avis)
                  </span>
                </div>
                <div className="experience">
                  🏆 {prof.experience_display || `${prof.experience_annees || 1}+ ans`}
                </div>
              </div>

              {/* Spécialités */}
              <div className="specialties">
                {(prof.specialites || [prof.specialite]).filter(Boolean).slice(0, 3).map((spec, index) => (
                  <span key={index} className="specialty-tag">{spec}</span>
                ))}
              </div>

              {/* Bio */}
              {prof.bio && (
                <p className="professor-bio">
                  {prof.bio.length > 100 ? `${prof.bio.substring(0, 100)}...` : prof.bio}
                </p>
              )}

              {/* Langues et pays */}
              <div className="professor-details">
                <div className="languages">
                  🌍 {(prof.langues_parlees || ['Arabe']).join(', ')}
                </div>
                {prof.pays_origine && (
                  <div className="country">📍 {prof.pays_origine}</div>
                )}
              </div>

              {/* Dernière connexion */}
              {prof.derniere_connexion && (
                <div className="last-seen">
                  🕒 {getLastSeenText(prof.derniere_connexion)}
                </div>
              )}

              {/* 🆕 Boutons d'action MODIFIÉS */}
              <div className="professor-actions">
                {/* 🆕 Bouton de réservation avec modal */}
                {isStudent() ? (
                  <button
                    onClick={() => handleBookingClick(prof)}
                    className="btn-primary"
                  >
                    🎓 Réserver un cours
                  </button>
                ) : (
                  <Link
                    to={`/reservation?prof_id=${prof.id}`}
                    className="btn-primary"
                  >
                    📅 Réserver un cours
                  </Link>
                )}
                
                <Link
                  to={`/professeur/${prof.id}`}
                  className="btn-secondary"
                >
                  👁️ Voir le profil complet
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredProfs.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>Aucun professeur trouvé</h3>
          <p>Essayez d'ajuster vos filtres pour voir plus de résultats.</p>
        </div>
      )}

      {/* Footer avec statistiques enrichies */}
      <div className="professors-footer">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{professors.length}</div>
            <div className="stat-label">Professeurs</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{professors.filter(p => (p.rating_moyen || 0) >= 4.5).length}</div>
            <div className="stat-label">Excellents (4.5⭐+)</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{professors.filter(p => p.disponible_maintenant || p.is_online).length}</div>
            <div className="stat-label">En ligne</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{Math.round(professors.reduce((acc, p) => acc + (p.prix_30min || 15), 0) / professors.length)}€</div>
            <div className="stat-label">Prix moyen</div>
          </div>
        </div>
      </div>

      {/* 🆕 Modal de réservation */}
      {showBookingModal && selectedProfForBooking && (
        <BookingInterface
          profId={selectedProfForBooking.id}
          profData={selectedProfForBooking}
          onClose={handleCloseBooking}
        />
      )}
    </div>
  );
}

export default Professeurs;
