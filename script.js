// 1. Configuration
const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. REGISTER FUNCTION (With CAPTCHA Security)
async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // --- CAPTCHA CHECK ---
    // Kinukuha ang token base sa kung anong provider ang gamit mo
    let captchaToken = "";
    if (typeof turnstile !== 'undefined') {
        captchaToken = turnstile.getResponse();
    } else if (typeof hcaptcha !== 'undefined') {
        captchaToken = hcaptcha.getResponse();
    }

    if (!captchaToken) {
        return alert("Please verify that you are not a robot (CAPTCHA)!");
    }

    if (!email || !password) return alert("Please fill in all fields!");

    // Sign up with captcha token option
    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
            captchaToken: captchaToken, 
        },
    });

    if (error) {
        // I-reset ang captcha widget para makasubok ulit ang user
        if (typeof turnstile !== 'undefined') turnstile.reset();
        else if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
        return alert("Registration Error: " + error.message);
    }

    if (data.user) {
        // Pagpasok ng profile sa 'students' table
        const { error: dbError } = await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: "New Student", 
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student" // Default role
        });

        if (dbError) {
            console.error("DB Error:", dbError);
            alert("Account created, but profile setup failed: " + dbError.message);
        } else {
            alert("Registered successfully! You can now login.");
        }
    }
}

// 3. LOGIN FUNCTION
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    if (!email || !password) return alert("Email and Password are required!");

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    
    if (error) return alert("Login Failed: " + error.message);

    // Kukunin ang role para malaman kung saan idi-redirect
    const { data: profile, error: profileError } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

    if (profileError || !profile) {
        return alert("Profile error. Please contact the administrator.");
    }

    // Role-based Redirection
    if (profile.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}