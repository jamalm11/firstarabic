// src/pages/Confirmation.js
import React from "react";
import { useLocation, Link } from "react-router-dom";

function Confirmation() {
  const location = useLocation();
  const { profName, date, time } = location.state || {};

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1>Réservation confirmée !</h1>
        
        <div className="confirmation-details">
          <p>
            <strong>Professeur:</strong> {profName || "Non spécifié"}
          </p>
          <p>
            <strong>Date:</strong> {date || "Non spécifié"}
          </p>
          <p>
            <strong>Heure:</strong> {time || "Non spécifié"}
          </p>
        </div>

        <Link to="/dashboard" className="dashboard-button">
          Retour au tableau de bord
        </Link>
      </div>

      <style jsx>{`
        .confirmation-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background-color: #f7fafc;
        }

        .confirmation-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        .confirmation-icon {
          font-size: 3rem;
          color: #48bb78;
          margin-bottom: 1.5rem;
        }

        .confirmation-card h1 {
          font-size: 1.75rem;
          color: #2d3748;
          margin-bottom: 1.5rem;
        }

        .confirmation-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .confirmation-details p {
          margin: 0.75rem 0;
          color: #4a5568;
        }

        .dashboard-button {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: #4299e1;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .dashboard-button:hover {
          background-color: #3182ce;
        }
      `}</style>
    </div>
  );
}

export default Confirmation;
