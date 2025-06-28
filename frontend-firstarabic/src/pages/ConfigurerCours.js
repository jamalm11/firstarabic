// src/pages/ConfigurerCours.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ConfigurerCours() {
  const [date, setDate] = useState(new Date());
  const [duration, setDuration] = useState("30");
  const [period, setPeriod] = useState("morning");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      date: date.toISOString(),
      duration,
      period,
    });
    navigate(`/profs-disponibles?${params.toString()}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📅 Planifier un cours</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>🕒 Durée :</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">60 min</option>
          </select>
        </div>

        <div>
          <label>📆 Date :</label>
          <DatePicker selected={date} onChange={(date) => setDate(date)} />
        </div>

        <div>
          <label>🕰 Période :</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="morning">Matin (7h–12h)</option>
            <option value="afternoon">Après-midi (12h–19h)</option>
            <option value="evening">Soir (19h–23h)</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>
          🔍 Trouver un professeur
        </button>
      </form>
    </div>
  );
}

export default ConfigurerCours;
