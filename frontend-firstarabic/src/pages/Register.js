// src/pages/Register.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("eleve");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("📧 Vérification de l’email :", email);

      const check = await fetch("http://localhost:3001/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const result = await check.json();
      console.log("🧪 Résultat check-email:", result);

      if (result.exists) {
        alert("❌ Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.");
        return;
      }

      console.log("🔐 Tentative d'inscription via Supabase...");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nom,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;

      const user = data?.user;
      const userId = user?.id;
      console.log("✅ Utilisateur Supabase créé :", user);

      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;

      if (userId && accessToken) {
        const insertUrl = role === "eleve" ? "http://localhost:3001/eleves" : "http://localhost:3001/profs";
        console.log(`📥 Insertion dans ${role === "eleve" ? "eleves" : "profs"} à ${insertUrl}`);

        const insertResponse = await fetch(insertUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            nom,
            email,
            created_by: userId
          }),
        });

        const insertResult = await insertResponse.json();
        console.log("✅ Résultat insertion :", insertResult);
      }

      alert("📧 Un lien de confirmation a été envoyé à votre email. Veuillez l’activer avant de vous connecter.");
      navigate("/");
    } catch (err) {
      console.error("❌ Erreur d'inscription :", err);
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

      <p style={{ marginTop: "20px" }}>
        Vous avez déjà un compte ? <a href="/">Se connecter</a>
      </p>
    </div>
  );
}

export default Register;
