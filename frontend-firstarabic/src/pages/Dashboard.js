// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = session?.user?.user_metadata?.role;
      if (role === "prof") {
        navigate("/prof-dashboard");
        return;
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role;
      if (role === "prof") {
        navigate("/prof-dashboard");
        return;
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
