// backend/add_prof.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 👇 Exemple de disponibilité
const disponibilites = [
  { jour: "lundi", heures: ["10:00", "14:00"] },
  { jour: "mercredi", heures: ["09:00", "16:00"] },
];

(async () => {
  const { data: user, error: userError } = await supabase.auth.getUser(process.env.TEST_USER_TOKEN);
  if (userError) {
    console.error("Erreur récupération user :", userError.message);
    return;
  }

  const { data, error } = await supabase
    .from("profs")
    .insert([
      {
        nom: "Ahmed",
        disponibilites,
        created_by: user.user.id,
      },
    ]);

  if (error) {
    console.error("Erreur insertion prof :", error.message);
  } else {
    console.log("✅ Prof ajouté :", data);
  }
})();
