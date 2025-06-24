import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function AdminProfValidation() {
  const [profs, setProfs] = useState([]);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer le token d'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert("🔐 Accès réservé aux administrateurs");
        navigate("/login");
        return;
      }
      setToken(session.access_token);
    });
  }, [navigate]);

  useEffect(() => {
    if (!token) return;

    // Charger tous les profs non validés
    axios
      .get("http://localhost:3001/profs/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const nonValides = res.data.profs.filter((p) => !p.is_validated);
        setProfs(nonValides);
      })
      .catch((err) => {
        console.error("Erreur chargement profs", err);
        alert("Erreur chargement des professeurs");
      });
  }, [token]);

  const validerProf = async (id) => {
    try {
      await axios.put(
        `http://localhost:3001/prof/${id}/valider`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfs(profs.filter((p) => p.id !== id));
      alert("✅ Prof validé !");
    } catch (err) {
      console.error("Erreur validation prof", err);
      alert("Erreur validation prof");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🧑‍🏫 Validation des professeurs</h2>
      {profs.length === 0 ? (
        <p>Aucun professeur en attente de validation.</p>
      ) : (
        <ul>
          {profs.map((prof) => (
            <li key={prof.id} style={{ marginBottom: "1rem" }}>
              {prof.nom} ({prof.email}){" "}
              <button onClick={() => validerProf(prof.id)}>✅ Valider</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminProfValidation;
