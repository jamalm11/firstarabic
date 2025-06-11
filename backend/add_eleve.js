// backend/add_eleve.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Création du client avec le JWT (le token de l'élève)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
      },
    },
  }
);

(async () => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("❌ Erreur auth:", authError.message);
    return;
  }

  const userId = userData?.user?.id;
  if (!userId) {
    console.error("❌ Impossible de récupérer l'ID utilisateur depuis le token.");
    return;
  }

  const { data, error } = await supabase
    .from('eleves')
    .insert([
      {
        nom: "Élève test",
        created_by: userId
      }
    ])
    .select();

  if (error) {
    console.error("❌ Erreur à l'insertion:", error.message);
  } else {
    console.log("✅ Élève ajouté:", data[0]);
  }
})();
