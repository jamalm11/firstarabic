import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "../supabaseClient";
import axios from "axios";

function Reservation() {
  // États (inchangés)
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const profId = new URLSearchParams(location.search).get("prof_id");

  // Logique existante (identique)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setToken(session?.access_token || null);
    });
  }, []);

  useEffect(() => {
    const fetchProf = async () => {
      if (!token || !profId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await axios.get("http://localhost:3001/profs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const found = res.data?.profs?.find((p) => p.id === profId);
        if (!found) {
          setError("Professeur introuvable");
          return;
        }

        setProf(found);
      } catch (err) {
        console.error("❌ Erreur récupération prof :", err);
        setError("Erreur lors du chargement du professeur");
      } finally {
        setLoading(false);
      }
    };

    fetchProf();
  }, [token, profId]);

  const handleReservation = async () => {
    setIsSubmitting(true);
    try {
      const fullDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      fullDate.setHours(hours, minutes, 0);

      const { data: eleveData } = await axios.get("http://localhost:3001/eleves", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const eleve_id = eleveData.eleves[0]?.id;
      if (!eleve_id) throw new Error("Élève non trouvé");

      await axios.post(
        "http://localhost:3001/cours",
        {
          date: fullDate.toISOString(),
          prof_id: profId,
          eleve_id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate("/confirmation", {
        state: {
          profName: prof.nom,
          date: fullDate.toLocaleDateString("fr-FR", {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }),
          time: selectedTime
        }
      });
    } catch (err) {
      console.error("❌ Erreur réservation :", err);
      alert(`Erreur lors de la réservation: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Affichage conditionnel - Nouveau style
  if (!profId) {
    return (
      <div className="reservation-container">
        <div className="error-card">
          <h2>Professeur non sélectionné</h2>
          <p>Veuillez d'abord choisir un professeur avant de réserver.</p>
          <Link to="/professeurs" className="primary-button">
            Choisir un professeur
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="reservation-container">
        <div className="error-card">
          <h2>Connexion requise</h2>
          <p>Veuillez vous connecter pour accéder à cette page.</p>
          <Link to="/login" className="primary-button">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner">Chargement en cours...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!prof) return <div className="error-message">Professeur non trouvé</div>;

  return (
    <div className="reservation-container">
      <div className="reservation-card">
        <header className="reservation-header">
          <h1>Réserver avec {prof.nom}</h1>
          {prof.specialite && <span className="specialite-badge">{prof.specialite}</span>}
        </header>

        <div className="form-group">
          <label className="form-label">Date du cours</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            dateFormat="dd/MM/yyyy"
            className="date-picker"
            popperPlacement="bottom-start"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Heure du cours</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="time-select"
          >
            {["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"].map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleReservation}
          disabled={isSubmitting}
          className={`submit-button ${isSubmitting ? 'loading' : ''}`}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Traitement...
            </>
          ) : (
            "Confirmer la réservation"
          )}
        </button>

        <Link to="/professeurs" className="back-link">
          ← Retour à la liste des professeurs
        </Link>
      </div>

      <style jsx>{`
        .reservation-container {
          max-width: 100%;
          padding: 20px;
          display: flex;
          justify-content: center;
        }

        .reservation-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 100%;
          max-width: 500px;
        }

        .reservation-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .reservation-header h1 {
          font-size: 1.5rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .specialite-badge {
          background: #e2e8f0;
          color: #4a5568;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          display: inline-block;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #4a5568;
        }

        .date-picker, .time-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .date-picker:focus, .time-select:focus {
          outline: none;
          border-color: #4299e1;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover {
          background-color: #3182ce;
        }

        .submit-button.loading {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .spinner {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 2px solid white;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .back-link {
          display: block;
          text-align: center;
          margin-top: 1.5rem;
          color: #718096;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #4a5568;
          text-decoration: underline;
        }

        .error-card {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .error-card h2 {
          color: #e53e3e;
          margin-bottom: 1rem;
        }

        .primary-button {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: #4299e1;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          margin-top: 1rem;
          transition: background-color 0.2s;
        }

        .primary-button:hover {
          background-color: #3182ce;
        }

        .loading-spinner {
          text-align: center;
          padding: 2rem;
          color: #4a5568;
        }

        .error-message {
          text-align: center;
          padding: 2rem;
          color: #e53e3e;
          background: #fff5f5;
          border-radius: 8px;
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

export default Reservation;
