// src/App.js
import Professeurs from "./pages/Professeurs";
import Reservation from "./pages/Reservation";
import Planning from "./pages/Planning";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from './pages/ForgotPassword';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfDashboard from "./pages/ProfDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prof-dashboard" element={<ProfDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/professeurs" element={<Professeurs />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* ✅ Pas besoin de /login, la page de connexion est déjà sur / */}
      </Routes>
    </Router>
  );
}

export default App;
