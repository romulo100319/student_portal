const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFubm9uIiwiaWF0IjoxNzcwNjI2MDY0LCJleHAiOjIwODYyMDIwNjR9.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// REGISTER
async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) return alert("Fill up all fields!");

    const { data, error } = await _supabase.auth.signUp({ email, password });

    if (error) return alert("Reg Error: " + error.message);

    if (data.user) {
        // Insert profile data to 'students' table
        const { error: dbError } = await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: "New Student",
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student" // default role
        });

        if (dbError) alert("Profile Error: " + dbError.message);
        else alert("Registered! Check your email or login now.");
    }
}

// LOGIN
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) return alert("Login Failed: " + error.message);

    // Check role and redirect
    const { data: profile } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

    if (profile?.role === "admin") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "dashboard.html";
    }
}