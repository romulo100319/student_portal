// 1. Configuration
const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. REGISTER FUNCTION
async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (!email || !password) return alert("Fill up all fields!");

    const { data, error } = await _supabase.auth.signUp({ email, password });
    if (error) return alert("Reg Error: " + error.message);

    if (data.user) {
        // Nag-insert tayo gamit ang 'id' para mag-match sa Supabase screenshot mo
        const { error: dbError } = await _supabase.from("students").insert({
            id: data.user.id, // Match sa column 'id' sa screenshot
            email: data.user.email,
            name: "New Student",
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student" 
        });
        if (dbError) alert("Profile Error: " + dbError.message);
        else alert("Registered! Check your email or login now.");
    }
}

// 3. LOGIN FUNCTION (FIXED REDIRECT)
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) return alert("Login Failed: " + error.message);

    // DITO ANG FIX: Kinukuha ang role gamit ang 'id' column
    const { data: profile, error: profileError } = await _supabase
        .from("students")
        .select("role")
        .eq("id", data.user.id) // Sinisiguro na 'id' ang gamit
        .single();

    if (profileError || !profile) {
        console.error("Profile Error:", profileError);
        return alert("Profile not found in students table!");
    }

    // Role-based redirection
    if (profile.role === 'admin') {
        alert("Welcome Admin!");
        window.location.href = 'admin.html'; // Papasok na sa Audit Logs page
    } else {
        alert("Welcome Student!");
        window.location.href = 'dashboard.html';
    }
}