import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ProfsDisponibles() {
  const [profs, setProfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialDate = searchParams.get("date");
  const period = searchParams.get("period");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token || null);
    });
  }, []);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(new Date(initialDate));
    }
  }, [initialDate]);

  useEffect(() => {
    const fetchProfs = async () => {
      if (!token || !selectedDate || !period) return;

      try {
        const dateString = selectedDate.toISOString();
        const res = await axios.get("http://localhost:3001/profs-disponibles", {
          headers: { Authorization: `Bearer ${token}` },
          params: { date: dateString, period },
        });

        setProfs(res.data.profs || []);
      } catch (err) {
        console.error("Erreur:", err.response?.data || err.message);
        setError("Erreur lors de la récupération");
      } finally {
        setLoading(false);
      }
    };

    fetchProfs();
  }, [token, selectedDate, period]);

  const handleReservation = () => {
    if (!selectedProf) {
      alert("Veuillez sélectionner un professeur");
      return;
    }
    navigate(`/reservation?prof_id=${selectedProf}&date=${selectedDate.toISOString()}`);
  };

  if (!selectedDate || !period) return <p>⚠️ Paramètres manquants (date ou période)</p>;
  if (loading) return <p>⏳ Chargement des professeurs...</p>;
  if (error) return <p>❌ {error}</p>;

  const dateLocale = selectedDate.toLocaleDateString("fr-FR", {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div style={{ 
      padding: "2rem",
      maxWidth: "600px",
      margin: "0 auto"
    }}>
      <h2 style={{ color: "#2d3748", marginBottom: "1.5rem" }}>
        📅 Réservation de cours - {dateLocale}
      </h2>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Modifier la date :
        </label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          minDate={new Date()}
          dateFormat="dd/MM/yyyy"
          className="date-picker"
        />
      </div>

      {profs.length === 0 ? (
        <div style={{
          padding: "1rem",
          backgroundColor: "#fff5f5",
          borderRadius: "6px",
          borderLeft: "4px solid #f56565",
          color: "#742a2a"
        }}>
          Aucun professeur disponible pour cette plage horaire ({period}).
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <label 
              htmlFor="prof-select"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}
            >
              Sélectionnez un professeur :
            </label>
            <select
              id="prof-select"
              value={selectedProf}
              onChange={(e) => setSelectedProf(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "1rem"
              }}
            >
              <option value="">-- Choisissez un professeur --</option>
              {profs.map((prof) => (
                <option 
                  key={prof.id} 
                  value={prof.id}
                >
                  {prof.nom} ({prof.specialite || 'Général'}) • {prof.creneau}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReservation}
            disabled={!selectedProf}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: selectedProf ? "#4299e1" : "#a0aec0",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: selectedProf ? "pointer" : "not-allowed",
              transition: "background-color 0.2s"
            }}
          >
            Réserver ce professeur
          </button>
        </>
      )}
    </div>
  );
}

export default ProfsDisponibles;
