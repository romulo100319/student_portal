const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// REGISTER
async function register() {
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });

  if (error) return alert(error.message);

  await supabase.from("students").insert({
    user_id: data.user.id,
    email: data.user.email,
    name: "New Student",
    student_no: "TEMP-000"
  });

  alert("Registered successfully");
}
