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
      console.log("✅ [Etape 1] Session récupérée :", session);
      console.log("🔑 [Etape 1] Access Token :", access_token);
    });
  }, [navigate]);

  // 2. Récupération du professeur
  useEffect(() => {
    const fetchProf = async () => {
      if (!token || !profId) {
        console.warn("⏳ [Etape 2] Token ou profId manquant, attente...");
        return;
      }

      console.log("🔍 [Etape 2] Récupération des professeurs...");
      try {
        const res = await axios.get("http://localhost:3001/profs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ [Etape 2] Liste profs reçue :", res.data);
        const found = res.data?.profs?.find((p) => p.id === profId);
        if (!found) {
          console.warn("❌ [Etape 2] Professeur introuvable dans la liste !");
          setError("Professeur introuvable");
        } else {
          setProf(found);
          console.log("👨‍🏫 [Etape 2] Professeur trouvé :", found);
        }
      } catch (err) {
        console.error("❌ [Etape 2] Erreur récupération prof :", err);
        setError("Erreur lors du chargement du professeur");
      } finally {
        setLoading(false);
      }
    };

    fetchProf();
  }, [token, profId]);

  // 3. Envoi de la réservation avec correction du fuseau horaire
  const handleReservation = async () => {
    console.log("🟡 [Etape 3] Début de la réservation...");
    try {
      if (!token) {
        console.warn("⛔ [Etape 3] Token invalide");
        alert("⛔ Session expirée. Veuillez vous reconnecter.");
        navigate("/");
        return;
      }

      // 🆕 FIX: Construction correcte de la date en heure locale
      const [hours, minutes] = selectedTime.split(":").map(Number);
      
      // Créer une nouvelle date avec l'année, mois, jour de selectedDate
      // mais avec l'heure/minute choisie
      const fullDate = new Date(selectedDate);
      fullDate.setHours(hours, minutes, 0, 0);

      // 🚨 IMPORTANT: Garder l'heure locale, ne pas convertir en UTC
      // On va envoyer la date en format local
      const year = fullDate.getFullYear();
      const month = String(fullDate.getMonth() + 1).padStart(2, '0');
      const day = String(fullDate.getDate()).padStart(2, '0');
      const hour = String(hours).padStart(2, '0');
      const minute = String(minutes).padStart(2, '0');
      
      // Format: YYYY-MM-DDTHH:MM:SS (sans Z pour éviter la conversion UTC)
      const localDateString = `${year}-${month}-${day}T${hour}:${minute}:00`;

      console.log("📆 [Etape 3] Date sélectionnée :", selectedDate);
      console.log("🕐 [Etape 3] Heure sélectionnée :", selectedTime);
      console.log("📅 [Etape 3] Date complète construite :", fullDate);
      console.log("📨 [Etape 3] Date envoyée au backend :", localDateString);

      // Récupérer l'élève connecté
      console.log("🔍 [Etape 3] Récupération des données élève...");
      const { data: eleveData } = await axios.get("http://localhost:3001/eleves", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ [Etape 3] Données élève reçues :", eleveData);

      const eleve_id = eleveData.eleves?.[0]?.id;
      if (!eleve_id) {
        console.error("❌ [Etape 3] Élève introuvable !");
        throw new Error("Élève non trouvé");
      }

      const payload = {
        date: localDateString, // 🆕 Utiliser la date locale au lieu de ISO
        prof_id: profId,
        eleve_id,
      };

      console.log("📨 [Etape 3] Payload envoyé au backend :", payload);

      const res = await axios.post("http://localhost:3001/cours", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ [Etape 3] Réservation réussie :", res.data);
      alert("✅ Cours réservé avec succès !");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ [Etape 3] Erreur lors de la réservation :", err?.response?.data || err.message);
      
      // 🆕 Affichage d'un message d'erreur plus informatif
      const errorMessage = err?.response?.data?.message || "Erreur lors de la réservation";
      const disponibilites = err?.response?.data?.disponibilites_du_jour;
      
      if (disponibilites) {
        alert(`❌ ${errorMessage}\n\nCréneaux disponibles: ${disponibilites.join(', ')}`);
      } else {
        alert(`❌ ${errorMessage}`);
      }
    }
  };

  // 4. Affichage conditionnel
  if (!profId) {
    console.warn("⚠️ [Etape 4] Aucun prof_id trouvé dans l'URL");
    return (
      <div style={{ padding: "2rem" }}>
        <p>⚠️ Aucun professeur sélectionné.</p>
        <p>
          Veuillez d'abord <Link to="/professeurs">choisir un professeur</Link>.
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

      <div style={{ marginBottom: "1rem" }}>
        <label>Date :</label>
        <DatePicker 
          selected={selectedDate} 
          onChange={setSelectedDate}
          dateFormat="dd/MM/yyyy"
          minDate={new Date()} // Empêche de sélectionner une date passée
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Heure :</label>
        <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
          {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <button onClick={handleReservation} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Réserver ce créneau
      </button>

      <div style={{ marginTop: "1rem" }}>
        <Link to="/professeurs">← Retour aux professeurs</Link>
      </div>
    </div>
  );
}

export default Reservation;
