const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

function getCaptchaToken() {
    return (typeof hcaptcha !== 'undefined') ? hcaptcha.getResponse() : "";
}

// Custom Helper para sa Loading Alert
const showLoading = (msg) => {
    Swal.fire({
        title: msg,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
};

// 2. REGISTER FUNCTION
async function register() {
    const name = document.getElementById("reg-name").value; 
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const captchaToken = getCaptchaToken();

    if (!captchaToken) return Swal.fire("Oops!", "Paki-verify muna na tao ka (CAPTCHA)! 🤖", "warning");
    if (!name || !email || !password) return Swal.fire("Kulang!", "Paki-fill up lahat ng fields!", "info");

    showLoading("Creating your account...");

    const { data, error } = await _supabase.auth.signUp({
        email, password, options: { captchaToken }
    });

    if (error) {
        hcaptcha.reset();
        return Swal.fire("Error", error.message, "error");
    }

    if (data.user) {
        await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: name,
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student"
        });

        Swal.fire({
            title: "Success!",
            text: "Account created! Check your email for verification.",
            icon: "success",
            confirmButtonColor: "#3085d6"
        }).then(() => toggleAuth());
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
        email, password, options: { captchaToken } 
    });
    
    if (error) {
        hcaptcha.reset();
        return Swal.fire("Login Failed", error.message, "error");
    }

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

// 4. UI ANIMATION TOGGLE
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
        
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
    }, 500);
}