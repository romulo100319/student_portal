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
        // DITO NATIN I-HARDCODE ANG ROLE NA STUDENT
        const { error: dbError } = await _supabase.from("students").insert({
            id: data.user.id, 
            user_id: data.user.id,
            email: data.user.email,
            name: "New Student", // Pwede mo rin itong lagyan ng input field later
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student" // <--- Eto yung mahalaga, wag lagyan ng quotes sa database
        });

        if (dbError) {
            console.error("Profile Error:", dbError);
            alert("Profile Error: " + dbError.message);
        } else {
            alert("Registered successfully as a Student!");
        }
    }
}

// 3. LOGIN FUNCTION (THE ULTIMATE FIX)
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) return alert("Login Failed: " + error.message);

    // Hahanapin natin ang profile gamit ang user_id column
    const { data: profile, error: profileError } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", data.user.id) // Ito na ang gagamitin natin
        .single();

    if (profileError || !profile) {
        return alert("Profile not found! I-check kung tama ang user_id sa table.");
    }

    if (profile.role === 'admin') {
        alert("Welcome Admin!");
        window.location.href = 'admin.html';
    } else {
        alert("Welcome Student!");
        window.location.href = 'dashboard.html';
    }
}