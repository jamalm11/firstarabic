// src/pages/MesCoursProf.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

function MesCoursProf() {
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchCours = async () => {
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr) {
        console.error("❌ Erreur récupération session Supabase :", sessionErr);
        return;
      }

      const token = sessionData?.session?.access_token;
      console.log("🔐 Token actuel (frontend) :", token);

      const res = await axios.get("http://localhost:3001/cours-prof", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Données reçues depuis backend :", res.data);
      setCours(res.data.cours || []);
    } catch (err) {
      console.error("❌ Erreur appel API /cours-prof :", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchCours();
}, []);

  const generateJitsiLink = (coursId) => {
    return `https://meet.jit.si/FirstArabic-${coursId}`;
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📚 Mes Cours à Venir</h2>

      {loading ? (
        <p>Chargement...</p>
      ) : cours.length === 0 ? (
        <p>Aucun cours programmé.</p>
      ) : (
        cours.map((c) => (
          <div key={c.id} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
            <h4>{new Date(c.date).toLocaleString("fr-FR")}</h4>
            <p><strong>Statut :</strong> {c.statut}</p>
            <p><strong>Élève :</strong> {c.eleves?.nom || "Nom inconnu"} ({c.eleves?.email || "Email inconnu"})</p>
            <a
              href={generateJitsiLink(c.id)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              🔗 Lien vers la classe virtuelle
            </a>
          </div>
        ))
      )}
    </div>
  );
}

export default MesCoursProf;
