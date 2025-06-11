const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aerhvxfzzpveykkedmej.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlcmh2eGZ6enB2ZXlra2VkbWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMjgzOTcsImV4cCI6MjA2NDYwNDM5N30.kraJGVn-0O-D7DXTfwVpqP9dbHpJOmALqOrzVMhlONM'
);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'jamal.marouane@gmail.com',
    password: 'hoxxeg-3wimje-surgoJ',
  });

  if (error) return console.error('Erreur:', error.message);
  console.log('Token:', data.session.access_token);
}

login();
