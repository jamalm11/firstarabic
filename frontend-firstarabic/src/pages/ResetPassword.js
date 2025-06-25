import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const result = await supabase.auth.getSession();
      const session = result?.data?.session;

      if (!session) {
        setError("Lien invalide ou expiré.");
      } else {
        // ✅ Nettoyage de l’URL après récupération
        window.history.replaceState({}, document.title, "/reset-password");
      }
    };

    checkSession();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError("Erreur : " + error.message);
    } else {
      setMessage("Mot de passe mis à jour avec succès !");
      setTimeout(() => navigate("/login"), 3000); // ⏳ Redirige après 3s
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Réinitialisation du mot de passe</h2>

      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ display: "block", margin: "10px auto" }}
        />
        <button type="submit">Mettre à jour</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}

export default ResetPassword;
