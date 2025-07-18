import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function ProfDashboard() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = session?.user?.user_metadata?.role;
      if (role === "eleve") {
        navigate("/dashboard"); // redirige les élèves
        return;
      }
      setSession(session);
      setToken(session?.access_token || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role;
      if (role === "eleve") {
        navigate("/dashboard");
        return;
      }
      setSession(session);
      setToken(session?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const createProfIfNeeded = async () => {
      if (!token || !session?.user?.email) return;

      try {
        const res = await axios.get("http://localhost:3001/profs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const exists = res.data.profs?.some(p => p.nom === session.user.email);
        if (!exists) {
          await axios.post("http://localhost:3001/prof", {
            nom: session.user.email,
            specialite: "non spécifiée",
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log("✅ Professeur créé automatiquement");
        }
      } catch (err) {
        console.error("❌ Erreur création prof :", err);
      }
    };

    createProfIfNeeded();
  }, [token, session?.user?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!session) {
    return <p>🔒 Veuillez vous connecter</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🎓 Bienvenue dans l'espace professeur</h1>
      <p>Connecté : {session.user.email}</p>
      <p>Des fonctionnalités spécifiques aux profs seront ajoutées ici.</p>
      <Link to="/planning">📅 Voir mon planning</Link>
      <br />
      <button onClick={handleLogout} style={{ marginTop: "2rem" }}>
        Se déconnecter
      </button>
    </div>
  );
}

export default ProfDashboard;
