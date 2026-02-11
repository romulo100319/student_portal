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
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const captchaToken = getCaptchaToken();
    
    if (!captchaToken) return alert("Paki-solve muna ang CAPTCHA! 🤖");

    // Disable button para hindi mag-double click
    const loginBtn = document.querySelector("button[onclick='login()']");
    loginBtn.disabled = true;
    loginBtn.innerText = "Logging in...";

    const { data, error } = await _supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken } 
    });
    
    if (error) {
        alert("Login Failed: " + error.message);
        // IMPORTANTE: Reset captcha kapag nag-fail para makakuha ng bagong token
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
        loginBtn.disabled = false;
        loginBtn.innerText = "Login";
        return;
    }

    // Kung success, diretso na sa profile check
    checkProfileAndRedirect(data.user);
}

// Helper para sa Redirection logic
async function checkProfileAndRedirect(user) {
    let { data: profile } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        const { data: newProfile } = await _supabase
            .from("students")
            .insert({
                user_id: user.id,
                email: user.email,
                name: user.email.split('@')[0],
                student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
                role: "student"
            })
            .select().single();
        profile = newProfile;
    }

    window.location.href = (profile.role === 'admin') ? 'admin.html' : 'dashboard.html';
}

// 4. UI ANIMATION TOGGLE
function toggleAuth() {
    const loginSec = document.getElementById('login-section');
    const registerSec = document.getElementById('register-section');
    const card = document.getElementById('auth-container');

    // Animation para sa Transition
    card.style.opacity = "0.5";
    card.style.transform = "scale(0.95) translateY(10px)";
    
    setTimeout(() => {
        if (loginSec.style.display === 'none') {
            loginSec.style.display = 'block';
            registerSec.style.display = 'none';
        } else {
            loginSec.style.display = 'none';
            registerSec.style.display = 'block';
        }
        
        card.style.opacity = "1";
        card.style.transform = "scale(1) translateY(0)";
        
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
    }, 300);
}