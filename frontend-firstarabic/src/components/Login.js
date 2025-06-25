// src/components/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Erreur de connexion : " + error.message);
    } else {
      const role = data.user?.user_metadata?.role || "eleve";

      if (role === "prof") {
        navigate("/prof-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Connexion à FirstArabic</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: "10px auto" }}
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto" }}
      />

      <button onClick={handleLogin} style={{ marginTop: "10px" }}>
        Se connecter
      </button>

      {/* 🔗 Lien vers mot de passe oublié */}
      <p style={{ marginTop: "10px" }}>
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </p>

      <p style={{ marginTop: "20px" }}>
        Pas encore de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </div>
  );
}

export default Login;
