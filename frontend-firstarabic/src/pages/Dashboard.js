import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [profs, setProfs] = useState([]);
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setToken(session?.access_token || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setToken(session?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const res = await axios.get("http://localhost:3001/profs");
        setProfs(res.data.profs || []);
      } catch (err) {
        console.error("Erreur récupération profs :", err);
      }
    };

    fetchProfs();
  }, []);

  useEffect(() => {
    const createEleveIfNeeded = async () => {
      if (!token || !session?.user?.email) return;

      try {
        const res = await axios.get("http://localhost:3001/eleves", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data.eleves || res.data.eleves.length === 0) {
          await axios.post(
            "http://localhost:3001/eleve",
            { nom: session.user.email },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("✅ Élève créé automatiquement");
        }
      } catch (err) {
        console.error("❌ Erreur création élève :", err);
      }
    };

    createEleveIfNeeded();
  }, [token, session?.user?.email]);

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
      const eleveIdResponse = await axios.get("http://localhost:3001/eleves", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const eleve = eleveIdResponse.data.eleves[0];

      await axios.post(
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

      alert("🎉 Cours réservé avec succès !");
    } catch (error) {
      console.error("❌ Erreur réservation :", error);
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
