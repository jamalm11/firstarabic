// src/pages/Dashboard.js - Version mise à jour avec évaluations
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";

function Dashboard() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [coursToReview, setCoursToReview] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Récupération de la session (votre code existant)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setToken(session.access_token);
      }
    });
  }, []);

  // Récupération des cours à évaluer
  useEffect(() => {
    const fetchCoursToReview = async () => {
      if (!token) return;

      setLoadingReviews(true);
      try {
        const response = await axios.get('http://localhost:3001/reviews/can-review', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setCoursToReview(response.data.cours_to_review);
        }
      } catch (err) {
        console.error("Erreur récupération cours à évaluer:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCoursToReview();
  }, [token]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!session) return <p>Chargement...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>👋 Bienvenue dans l'espace élève</h1>
      <p>Connecté : {session.user.email}</p>
      
      {/* Navigation principale */}
      <div style={{ 
        background: "#f8f9fa", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginBottom: "2rem" 
      }}>
        <h3>🚀 Actions rapides</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link 
            to="/professeurs" 
            style={{ 
              color: "#667eea", 
              textDecoration: "none", 
              fontWeight: "500",
              padding: "0.5rem 0"
            }}
          >
            📌 Réserver un cours
          </Link>
          <Link 
            to="/planning" 
            style={{ 
              color: "#667eea", 
              textDecoration: "none", 
              fontWeight: "500",
              padding: "0.5rem 0"
            }}
          >
            📅 Voir mon planning
          </Link>
        </div>
      </div>

      {/* Section des évaluations */}
      <div style={{ 
        background: "#fff3cd", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginBottom: "2rem",
        border: "1px solid #ffeaa7"
      }}>
        <h3>⭐ Cours à évaluer</h3>
        
        {loadingReviews ? (
          <p>Chargement des cours...</p>
        ) : coursToReview.length === 0 ? (
          <p style={{ color: "#6c757d", fontStyle: "italic" }}>
            Aucun cours terminé à évaluer pour le moment.
          </p>
        ) : (
          <div>
            <p style={{ marginBottom: "1rem", color: "#856404" }}>
              Vous avez {coursToReview.length} cours terminé{coursToReview.length > 1 ? 's' : ''} en attente d'évaluation :
            </p>
            
            {coursToReview.map((cours) => (
              <div 
                key={cours.id} 
                style={{
                  background: "white",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  border: "1px solid #dee2e6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong>👨‍🏫 {cours.profs?.nom}</strong>
                  <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                    📅 {new Date(cours.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#28a745" }}>
                    ✅ {cours.statut}
                  </div>
                </div>
                
                <Link 
                  to={`/review/${cours.id}`}
                  style={{
                    background: "#ffc107",
                    color: "#212529",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.9rem"
                  }}
                >
                  ⭐ Évaluer
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section mes évaluations */}
      <div style={{ 
        background: "#d1ecf1", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginBottom: "2rem",
        border: "1px solid #bee5eb"
      }}>
        <h3>📝 Mes évaluations</h3>
        <p style={{ marginBottom: "1rem", color: "#0c5460" }}>
          Consultez et gérez vos avis déjà publiés.
        </p>
        <Link 
          to="/my-reviews" 
          style={{ 
            color: "#0c5460", 
            textDecoration: "none", 
            fontWeight: "500",
            background: "white",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            display: "inline-block"
          }}
        >
          👁️ Voir mes évaluations
        </Link>
      </div>

      {/* Statistiques rapides */}
      <div style={{ 
        background: "#f8f9fa", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginBottom: "2rem" 
      }}>
        <h3>📊 Mes statistiques</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <div style={{ textAlign: "center", padding: "1rem", background: "white", borderRadius: "8px" }}>
            <div style={{ fontSize: "2rem", color: "#667eea" }}>📚</div>
            <div style={{ fontWeight: "600", color: "#2d3748" }}>Cours suivis</div>
            <div style={{ color: "#6c757d" }}>Bientôt disponible</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem", background: "white", borderRadius: "8px" }}>
            <div style={{ fontSize: "2rem", color: "#10b981" }}>⭐</div>
            <div style={{ fontWeight: "600", color: "#2d3748" }}>Évaluations</div>
            <div style={{ color: "#6c757d" }}>{coursToReview.length} en attente</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem", background: "white", borderRadius: "8px" }}>
            <div style={{ fontSize: "2rem", color: "#f59e0b" }}>🏆</div>
            <div style={{ fontWeight: "600", color: "#2d3748" }}>Progression</div>
            <div style={{ color: "#6c757d" }}>Bientôt disponible</div>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <button 
        onClick={handleLogout} 
        style={{ 
          background: "#dc3545",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "500"
        }}
      >
        🚪 Se déconnecter
      </button>
    </div>
  );
}

export default Dashboard;
