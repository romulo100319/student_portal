// 1. Configuration
const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Helper function para makuha ang token sa hCaptcha widget
function getCaptchaToken() {
    if (typeof hcaptcha !== 'undefined') {
        return hcaptcha.getResponse();
    }
    return "";
}

// 2. REGISTER FUNCTION
async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const captchaToken = getCaptchaToken();

    if (!captchaToken) return alert("Please verify that you are not a robot!");
    if (!email || !password) return alert("Please fill in all fields!");

    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: { captchaToken } // Isinasama ang token dito
    });

    if (error) {
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
        return alert("Registration Error: " + error.message);
    }

    if (data.user) {
        const { error: dbError } = await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: "New Student", 
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student"
        });

        if (dbError) alert("Profile Error: " + dbError.message);
        else alert("Registered successfully!");
    }
}

// 3. LOGIN FUNCTION (FIXED)
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const captchaToken = getCaptchaToken(); // Kunin ang captcha token para sa login
    
    if (!captchaToken) return alert("Please verify the CAPTCHA before logging in!");
    if (!email || !password) return alert("Email and Password are required!");

    // Idagdag ang captchaToken sa login options
    const { data, error } = await _supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken } 
    });
    
    if (error) {
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset(); // Reset para makasubok ulit
        return alert("Login Failed: " + error.message);
    }

    // Role-based Redirection
    const { data: profile, error: profileError } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

    if (profileError || !profile) return alert("Profile error. Contact admin.");

    window.location.href = (profile.role === 'admin') ? 'admin.html' : 'dashboard.html';
}  