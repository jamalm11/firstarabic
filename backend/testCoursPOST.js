// backend/testCoursPOST.js
require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const API_URL = 'http://localhost:3001'; // ton backend local
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 👤 Élève de test : modifie ici selon ton compte
const testUser = {
  email: "uhwtwxe7e7@xkxkud.com",
  password: "111111"
};

(async () => {
  try {
    console.log("🔐 Authentification Supabase...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (error) throw error;

    const token = data.session.access_token;
    const userId = data.user.id;
    console.log("✅ Jeton récupéré :", token.slice(0, 30) + '...');
    console.log("🆔 ID Supabase :", userId);

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    console.log("📆 Envoi POST /cours...");

    const body = {
      date: "2025-07-03T18:30:00.000Z", // date ISO
      prof_id: "2e192e5a-a0fa-45af-8f7c-0f515b41f81d", // mets ici un vrai prof_id de ta table
      eleve_id: "6fecb112-dbb5-46e2-b594-1b3eb5de2745" // mets ici un vrai eleve_id de ta table
    };
   console.log("📤 Données envoyées dans POST /cours :", body);
    const response = await fetch(`${API_URL}/cours`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const json = await response.json();

    if (response.ok) {
      console.log("✅ Cours créé avec succès :", json);
    } else {
      console.error("❌ Erreur création cours :", json);
    }

  } catch (err) {
    console.error("❌ Échec global :", err.message);
  }
})();
