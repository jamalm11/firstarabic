// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

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

  if (!session) return <div className="auth-message">🔒 Veuillez vous connecter</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👋 Bienvenue dans l'espace élève</h1>
        <p className="user-email">Connecté : {session.user.email}</p>
      </div>

      <div className="dashboard-links">
        <Link to="/planning" className="dashboard-link">
          <span className="link-icon">📅</span>
          <span className="link-text">Voir mon planning</span>
        </Link>

        <Link to="/configurer-cours" className="dashboard-link">
          <span className="link-icon">📌</span>
          <span className="link-text">Réserver un cours</span>
        </Link>
      </div>

      <button onClick={handleLogout} className="logout-button">
        Se déconnecter
      </button>

      <style jsx>{`
        .dashboard-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .dashboard-header h1 {
          font-size: 1.8rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .user-email {
          color: #4a5568;
          font-size: 0.9rem;
        }

        .dashboard-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .dashboard-link {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: #2d3748;
          transition: all 0.2s;
        }

        .dashboard-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .link-icon {
          font-size: 1.5rem;
          margin-right: 1rem;
        }

        .link-text {
          font-size: 1.1rem;
          font-weight: 500;
        }

        .logout-button {
          width: 100%;
          padding: 0.75rem;
          background: #f56565;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-button:hover {
          background: #e53e3e;
        }

        .auth-message {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: #2d3748;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
