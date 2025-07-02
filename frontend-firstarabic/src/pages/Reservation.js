// src/pages/Reservation.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "../supabaseClient";
import axios from "axios";

function Reservation() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const profId = new URLSearchParams(location.search).get("prof_id");

  // 1. Récupération session Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert("⛔ Session expirée. Merci de vous reconnecter.");
        navigate("/");
        return;
      }
      setSession(session);
      setToken(session?.access_token || null);
      console.log("🔐 Session récupérée:", session);
    });
  }, [navigate]);

  // 2. Récupération du professeur
  useEffect(() => {
    const fetchProf = async () => {
      if (!token || !profId) return;

      try {
        const res = await axios.get("http://localhost:3001/profs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const found = res.data?.profs?.find((p) => p.id === profId);
        if (!found) {
          setError("Professeur introuvable");
        } else {
          setProf(found);
          console.log("👨‍🏫 Professeur trouvé :", found);
        }
      } catch (err) {
        console.error("❌ Erreur récupération prof :", err);
        setError("Erreur lors du chargement du professeur");
      } finally {
        setLoading(false);
      }
    };

    fetchProf();
  }, [token, profId]);

  // 3. Envoi de la réservation
  const handleReservation = async () => {
    try {
      if (!token) {
        alert("⛔ Session expirée. Veuillez vous reconnecter.");
        navigate("/");
        return;
      }

      const fullDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      fullDate.setHours(hours, minutes, 0);

      console.log("📅 Créneau choisi :", fullDate.toISOString(), selectedTime);
      console.log("🔐 Token utilisé :", token);

      const { data: eleveData } = await axios.get("http://localhost:3001/eleves", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("👤 Données élève récupérées :", eleveData);

      const eleve_id = eleveData.eleves?.[0]?.id;
      if (!eleve_id) throw new Error("Élève non trouvé");

      const payload = {
        date: fullDate.toISOString(),
        prof_id: profId,
        eleve_id,
      };

      console.log("📨 Envoi réservation :", payload);

      const res = await axios.post("http://localhost:3001/cours", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Réservation réussie :", res.data);
      alert("✅ Cours réservé avec succès !");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Erreur lors de la réservation :", err?.response?.data || err.message);
      alert("Erreur lors de la réservation");
    }
  };

  // 4. Affichage conditionnel
  if (!profId) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>⚠️ Aucun professeur sélectionné.</p>
        <p>
          Veuillez d’abord <Link to="/professeurs">choisir un professeur</Link>.
        </p>
      </div>
    );
  }

  if (!session) return <p>🔐 Veuillez vous connecter</p>;
  if (error) return <p>❌ {error}</p>;
  if (loading) return <p>⏳ Chargement du professeur...</p>;
  if (!prof) return <p>⚠️ Professeur non trouvé</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📅 Réserver un cours avec {prof.nom}</h2>

      <label>Date :</label>
      <DatePicker selected={selectedDate} onChange={setSelectedDate} />

      <br />
      <label>Heure :</label>
      <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
        {["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"].map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <br />
      <button onClick={handleReservation} style={{ marginTop: "1rem" }}>
        Réserver ce créneau
      </button>
    </div>
  );
}

export default Reservation;
