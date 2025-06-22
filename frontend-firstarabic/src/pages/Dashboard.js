import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [session, setSession] = useState(null);
  const [profs, setProfs] = useState([]);
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const s = supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    // Charger la liste des profs disponibles
    axios.get("http://localhost:3001/profs").then((res) => {
      setProfs(res.data.profs || []);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleReservation = async () => {
    if (!selectedProf || !selectedDate) {
      alert("Veuillez sélectionner un professeur et une date.");
      return;
    }

    try {
      const token = session?.access_token;
      const user = session?.user;

      const eleveIdResponse = await axios.get("http://localhost:3001/eleves", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const eleve = eleveIdResponse.data.eleves[0];

      const res = await axios.post(
        "http://localhost:3001/cours",
        {
          prof_id: selectedProf,
          eleve_id: eleve.id,
          date: selectedDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Cours réservé avec succès !");
    } catch (error) {
      console.error("Erreur réservation :", error);
      alert("Erreur lors de la réservation");
    }
  };

  if (!session) {
    return <p>🔒 Veuillez vous connecter</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Bienvenue sur ton Dashboard</h1>
      <p>Connecté en tant que : {session.user.email}</p>

      <hr style={{ margin: "2rem 0" }} />

      <h2>📅 Réserver un cours</h2>

      <div>
        <label>Choisir un professeur : </label>
        <select value={selectedProf} onChange={(e) => setSelectedProf(e.target.value)}>
          <option value="">-- Sélectionner --</option>
          {profs.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.nom} ({prof.specialite})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>Choisir une date : </label>
        <input
          type="datetime-local"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <button onClick={handleReservation} style={{ marginTop: "1rem" }}>
        Réserver
      </button>

      <hr style={{ margin: "2rem 0" }} />

      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}

export default Dashboard;
