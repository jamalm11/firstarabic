// src/pages/Reservation.js - VERSION CORRIGÉE avec nouvelle API booking
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";
import './Reservation.css'; // Nouveau fichier CSS

function Reservation() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [reserving, setReserving] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const profId = new URLSearchParams(location.search).get("prof_id");

  // 1. Récupération session Supabase
  useEffect(() => {
    console.log("🔍 [Etape 1] Tentative de récupération session Supabase...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.warn("⛔ [Etape 1] Session introuvable, redirection.");
        alert("⛔ Session expirée. Merci de vous reconnecter.");
        navigate("/");
        return;
      }
      setSession(session);
      const access_token = session?.access_token || null;
      setToken(access_token);
      console.log("✅ [Etape 1] Session récupérée");
    });
  }, [navigate]);

  // 2. Récupération du professeur et des disponibilités (CORRIGÉ)
  useEffect(() => {
    const fetchProfAndAvailabilities = async () => {
      if (!token || !profId) {
        console.warn("⏳ [Etape 2] Token ou profId manquant, attente...");
        return;
      }

      console.log("🔍 [Etape 2] Récupération des professeurs...");
      try {
        // Récupérer le professeur
        const profRes = await axios.get("http://localhost:3001/profs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const found = profRes.data?.profs?.find((p) => p.id === profId);
        if (!found) {
          setError("Professeur introuvable");
          return;
        }

        setProf(found);

        // Récupérer les disponibilités du professeur
        console.log("🔍 Récupération des disponibilités...");
        const availRes = await axios.get(`http://localhost:3001/disponibilites?prof_id=${found.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAvailableSlots(availRes.data?.disponibilites || []);
        console.log("✅ Disponibilités récupérées:", availRes.data?.disponibilites);

      } catch (err) {
        console.error("❌ [Etape 2] Erreur récupération prof :", err);
        setError("Erreur lors du chargement du professeur");
      } finally {
        setLoading(false);
      }
    };

    fetchProfAndAvailabilities();
  }, [token, profId]); // ✅ Dépendances correctes - plus d'erreur ESLint

  // 3. Fonction pour vérifier si un créneau est disponible
  const isSlotAvailable = (date, time) => {
    const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = joursSemaine[date.getDay()];
    
    return availableSlots.some(slot => {
      if (slot.jour !== dayName) return false;
      
      const [slotStartHour, slotStartMin] = slot.heure_debut.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slot.heure_fin.split(':').map(Number);
      const [timeHour, timeMin] = time.split(':').map(Number);
      
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;
      const timeMinutes = timeHour * 60 + timeMin;
      
      return timeMinutes >= slotStartMinutes && timeMinutes + 30 <= slotEndMinutes;
    });
  };

  // 4. Génération des créneaux horaires intelligente
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots.filter(slot => isSlotAvailable(selectedDate, slot));
  };

  // 5. Génération du calendrier des 7 prochains jours
  const generateNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // 6. Réservation - VERSION CORRIGÉE avec nouvelle API
  const handleReservation = async () => {
    if (!selectedTime) {
      alert("⚠️ Veuillez sélectionner un créneau horaire");
      return;
    }

    setReserving(true);
    console.log("🟡 [Etape 3] Début de la réservation...");
    
    try {
      if (!token) {
        alert("⛔ Session expirée. Veuillez vous reconnecter.");
        navigate("/");
        return;
      }

      // Construction de la date
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const fullDate = new Date(selectedDate);
      fullDate.setHours(hours, minutes, 0, 0);

      const year = fullDate.getFullYear();
      const month = String(fullDate.getMonth() + 1).padStart(2, '0');
      const day = String(fullDate.getDate()).padStart(2, '0');
      
      const isoDateString = `${year}-${month}-${day}`;

      // 🔧 CORRECTION : Utiliser la nouvelle API /booking/reservations
      const payload = {
        prof_id: profId,
        date: isoDateString,
        heure_debut: selectedTime,
        duree_minutes: 30,
        message_eleve: "Réservation depuis l'interface web"
      };

      const res = await axios.post("http://localhost:3001/booking/reservations", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Réservation réussie:", res.data);
      alert("✅ Demande de cours envoyée avec succès ! Le professeur va confirmer votre réservation.");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Erreur lors de la réservation:", err?.response?.data || err.message);
      
      const errorMessage = err?.response?.data?.error || "Erreur lors de la réservation";
      alert(`❌ ${errorMessage}`);
    } finally {
      setReserving(false);
    }
  };

  // États de chargement
  if (!profId) {
    return (
      <div className="reservation-container">
        <div className="error-state">
          <h2>⚠️ Aucun professeur sélectionné</h2>
          <p>Veuillez d'abord <Link to="/professeurs">choisir un professeur</Link>.</p>
        </div>
      </div>
    );
  }

  if (!session) return <div className="loading-state">🔐 Veuillez vous connecter</div>;
  if (error) return <div className="error-state">❌ {error}</div>;
  if (loading) return <div className="loading-state">⏳ Chargement du professeur...</div>;
  if (!prof) return <div className="error-state">⚠️ Professeur non trouvé</div>;

  const next7Days = generateNext7Days();
  const availableTimeSlotsForSelectedDate = generateTimeSlots();

  return (
    <div className="reservation-container">
      {/* Header avec infos professeur */}
      <div className="professor-header">
        <div className="professor-info">
          <div className="professor-avatar">
            {prof.photo_url ? (
              <img src={prof.photo_url} alt={prof.nom} />
            ) : (
              <div className="avatar-placeholder">👨‍🏫</div>
            )}
          </div>
          <div className="professor-details">
            <h1>📅 Réserver un cours avec {prof.nom}</h1>
            {prof.specialites && (
              <div className="specialties">
                {prof.specialites.map((spec, index) => (
                  <span key={index} className="specialty-tag">{spec}</span>
                ))}
              </div>
            )}
            {prof.prix_30min && (
              <div className="price">💰 {prof.prix_30min}€ / 30 min</div>
            )}
          </div>
        </div>
      </div>

      <div className="reservation-content">
        {/* Sélecteur de date */}
        <div className="date-selector">
          <h3>📅 Choisir une date</h3>
          <div className="days-grid">
            {next7Days.map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`day-button ${selectedDate.toDateString() === date.toDateString() ? 'selected' : ''}`}
              >
                <div className="day-name">
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="day-number">
                  {date.getDate()}
                </div>
                <div className="day-month">
                  {date.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur d'heure */}
        <div className="time-selector">
          <h3>🕒 Choisir un créneau</h3>
          {availableTimeSlotsForSelectedDate.length === 0 ? (
            <div className="no-slots">
              <p>😔 Aucun créneau disponible pour cette date</p>
              <small>Essayez une autre date ou contactez le professeur</small>
            </div>
          ) : (
            <div className="time-grid">
              {availableTimeSlotsForSelectedDate.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`time-button ${selectedTime === time ? 'selected' : ''}`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Résumé et bouton de réservation */}
        {selectedTime && (
          <div className="reservation-summary">
            <h3>📋 Résumé</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span>👨‍🏫 Professeur:</span>
                <span>{prof.nom}</span>
              </div>
              <div className="summary-item">
                <span>📅 Date:</span>
                <span>{selectedDate.toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="summary-item">
                <span>🕒 Heure:</span>
                <span>{selectedTime}</span>
              </div>
              <div className="summary-item">
                <span>⏱️ Durée:</span>
                <span>30 minutes</span>
              </div>
              {prof.prix_30min && (
                <div className="summary-item total">
                  <span>💰 Total:</span>
                  <span>{prof.prix_30min}€</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleReservation} 
              disabled={reserving}
              className="reserve-button"
            >
              {reserving ? '⏳ Réservation...' : '✅ Confirmer la réservation'}
            </button>
          </div>
        )}
      </div>

      <div className="back-link">
        <Link to="/professeurs">← Retour aux professeurs</Link>
      </div>
    </div>
  );
}

export default Reservation;
