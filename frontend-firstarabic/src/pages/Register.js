import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("eleve"); // valeur par défaut
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nom,
            role: role, // 👈 très important
          },
        },
      });

      if (error) throw error;

      alert("📧 Un lien de confirmation a été envoyé à votre email.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Nom complet :</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>

        <div>
          <label>Email :</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label>Mot de passe :</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div>
          <label>Je suis : </label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="eleve">Élève</option>
            <option value="prof">Professeur</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>
          S'inscrire
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Register;
