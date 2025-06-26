// src/pages/Planning.js
import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import fr from "date-fns/locale/fr";
import { supabase } from "../supabaseClient";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function Planning() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchPlanning = async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      if (!token) return;

      const response = await fetch("http://localhost:3001/planning", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success && result.planning) {
        const formatted = result.planning.map((cours) => ({
          title: `${cours.eleve || "Élève"} / ${cours.prof || "Prof"}`,
          start: new Date(cours.date),
          end: new Date(new Date(cours.date).getTime() + 30 * 60000),
          resource: { lien: cours.lien },
        }));
        setEvents(formatted);
      }
    };

    fetchPlanning();
  }, []);

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: "#0d9488",
      color: "white",
      borderRadius: "8px",
      padding: "4px",
      border: "none",
    },
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📅 Planning des cours</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          if (event.resource?.lien) {
            window.open(event.resource.lien, "_blank");
          }
        }}
      />
    </div>
  );
}

export default Planning;
