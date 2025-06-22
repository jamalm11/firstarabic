import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      navigate("/dashboard");
    }
  };

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      alert("Erreur d'inscription : " + error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Connexion à FirstArabic</h2>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: "10px auto" }}
      />
      <input
        type="password"
        placeholder="mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto" }}
      />
      <button onClick={handleLogin} style={{ marginRight: "10px" }}>
        Se connecter
      </button>
      <button onClick={handleSignup}>S'inscrire</button>
    </div>
  );
}

export default Login;
