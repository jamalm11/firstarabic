// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role;

      if (role === "prof") {
        navigate("/prof-dashboard");
        return;
      }

      setSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role;

      if (role === "prof") {
        navigate("/prof-dashboard");
        return;
      }

      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 🧠 Vérifie si l’élève existe — sinon, le créer et notifier
  useEffect(() => {
    if (!session) return;

    const checkOrCreateEleve = async () => {
      const token = session.access_token;
      const email = session.user.email;

      try {
        const res = await axios.get("http://localhost:3001/eleves", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const alreadyExists = res.data?.eleves?.length > 0;

        if (!alreadyExists) {
          console.log("🚨 Élève introuvable côté BDD — création en cours...");

          const payload = { nom: email, email };
          await axios.post("http://localhost:3001/eleves", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log("✅ Élève inséré avec succès !");
          alert("✅ Votre profil a été créé avec succès !");
        } else {
          console.log("✅ Élève déjà présent en BDD");
        }
      } catch (err) {
        console.error("❌ Erreur vérification/insertion élève :", err?.response?.data || err.message);
      }
    };

    checkOrCreateEleve();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!session) return <p>🔒 Veuillez vous connecter</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>👋 Bienvenue dans l'espace élève</h1>
      <p>Connecté : {session.user.email}</p>

      <Link to="/professeurs">📌 Réserver un cours</Link>
      <br />
      <Link to="/planning">📅 Voir mon planning</Link>

      <button onClick={handleLogout} style={{ marginTop: "2rem" }}>
        Se déconnecter
      </button>
    </div>
  );
}

export default Dashboard;
