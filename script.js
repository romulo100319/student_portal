// 1. Configuration
const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Helper para sa Captcha
function getCaptchaToken() {
    if (typeof hcaptcha !== 'undefined') return hcaptcha.getResponse();
    return "";
}

// 2. REGISTER FUNCTION
async function register() {
    // Gumamit ng 'reg-' prefix para sa IDs ng Register Section
    const name = document.getElementById("reg-name").value; 
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const captchaToken = getCaptchaToken();

    if (!captchaToken) return alert("Paki-verify muna na tao ka (CAPTCHA)! 🤖");
    if (!name || !email || !password) return alert("Paki-fill up lahat ng fields!");

    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: { captchaToken }
    });

    if (error) {
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
        return alert("Registration Error: " + error.message);
    }

    if (data.user) {
        // Auto-create profile record
        const { error: dbError } = await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: name, // Gamitin ang actual name na ininput
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student"
        });

        if (dbError) console.error("DB Error:", dbError.message);
        alert("Registered successfully! Check your email for verification.");
        toggleAuth(); // Balik sa Login form matapos mag-register
    }
}

// 3. LOGIN FUNCTION
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const captchaToken = getCaptchaToken();
    
    if (!captchaToken) return alert("Paki-solve muna ang CAPTCHA! 🤖");
    if (!email || !password) return alert("Email and Password are required!");

    const { data, error } = await _supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken } 
    });
    
    if (error) {
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
        return alert("Login Failed: " + error.message);
    }

    // Role-based Redirection
    checkProfile