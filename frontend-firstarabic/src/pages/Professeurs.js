// ✅ Nouveau fichier : src/pages/Professeurs.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";

function Professeurs() {
  const [profs, setProfs] = useState([]);
  const [token, setToken] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setToken(session?.access_token || null);
    });
  }, []);

  useEffect(() => {
    const fetchProfs = async () => {
      if (!token || !session) return;

      try {
        const res = await axios.get("http://localhost:3001/profs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const emailEleve = session.user.email;
        const validProfs = res.data.profs.filter(
          (p) => p.is_validated !== false && p.email !== emailEleve
        );

        setProfs(validProfs);
      } catch (err) {
        console.error("Erreur récupération profs", err);
      }
    };

    fetchProfs();
  }, [token, session]);

  if (!token) return <p>⏳ Chargement...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>👨‍🏫 Sélectionnez un professeur</h2>
      <ul>
        {profs.map((prof) => (
          <li key={prof.id} style={{ margin: "1rem 0" }}>
            <Link to={`/reservation?prof_id=${prof.id}`}>
              {prof.nom} — {prof.specialite || "non spécifiée"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Professeurs;
