const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// FIX: Mas robust na pagkuha ng token
function getCaptchaToken() {
    if (typeof hcaptcha !== 'undefined') {
        const response = hcaptcha.getResponse();
        console.log("Captcha Token Captured:", response ? "Yes" : "No"); // Para makita mo sa Console
        return response;
    }
    return "";
}

const showLoading = (msg) => {
    Swal.fire({
        title: msg,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
};

// 2. REGISTER FUNCTION
// 2. REGISTER FUNCTION (No Captcha Version)
async function register() {
    const name = document.getElementById("reg-name").value; 
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    // TANGGAL NA ANG CAPTCHA CHECK DITO
    if (!name || !email || !password) return Swal.fire("Kulang!", "Paki-fill up lahat ng fields!", "info");

    showLoading("Creating your account...");

    // TANGGAL NA RIN ANG OPTIONS { captchaToken }
    const { data, error } = await _supabase.auth.signUp({
        email, 
        password
    });

    if (error) {
        return Swal.fire("Error", error.message, "error");
    }

    if (data.user) {
        // Auto-create profile record
        const { error: dbError } = await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: name,
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student"
        });

        if (dbError) console.error("Database Insert Error:", dbError.message);

        Swal.fire({
            title: "Success!",
            text: "Account created! You can now login.",
            icon: "success",
            confirmButtonColor: "#3085d6"
        }).then(() => {
            // Wala nang hcaptcha.reset() dito
            toggleAuth();
        });
    }
}

// 3. LOGIN FUNCTION
async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const captchaToken = getCaptchaToken();
    
    if (!captchaToken) return Swal.fire("Verification Required", "Paki-solve muna ang CAPTCHA! 🤖", "warning");

    showLoading("Verifying credentials...");

    const { data, error } = await _supabase.auth.signInWithPassword({ 
        email, 
        password, 
        options: { captchaToken: captchaToken } 
    });
    
    if (error) {
        hcaptcha.reset();
        return Swal.fire("Login Failed", error.message, "error");
    }

    checkProfileAndRedirect(data.user);
}

async function checkProfileAndRedirect(user) {
    let { data: profile, error: fetchError } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(); // Gumamit ng maybeSingle para hindi mag-error kung wala pang record

    if (!profile) {
        console.log("Profile missing, creating one...");
        const { data: newProfile, error: createError } = await _supabase
            .from("students")
            .insert({
                user_id: user.id,
                email: user.email,
                name: user.email.split('@')[0],
                student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
                role: "student"
            })
            .select().single();
        
        if (createError) {
            console.error("Auto-profile failed:", createError);
            return Swal.fire("System Error", "Hindi makagawa ng student profile.", "error");
        }
        profile = newProfile;
    }

    Swal.fire({
        title: "Welcome!",
        text: "Redirecting to your dashboard...",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        window.location.href = (profile.role === 'admin') ? 'admin.html' : 'dashboard.html';
    });
}

function toggleAuth() {
    const loginSec = document.getElementById('login-section');
    const registerSec = document.getElementById('register-section');
    const card = document.getElementById('auth-container');

    card.classList.add('animate__animated', 'animate__fadeOutDown');
    
    setTimeout(() => {
        if (loginSec.style.display === 'none') {
            loginSec.style.display = 'block';
            registerSec.style.display = 'none';
        } else {
            loginSec.style.display = 'none';
            registerSec.style.display = 'block';
        }
        
        card.classList.remove('animate__fadeOutDown');
        card.classList.add('animate__fadeInUp');
        
        // Refresh hCaptcha widgets upon switching forms
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
    }, 500);
}