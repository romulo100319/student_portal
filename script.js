// 1. Configuration
const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

function getCaptchaToken() {
    if (typeof hcaptcha !== 'undefined') return hcaptcha.getResponse();
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
        options: { captchaToken }
    });

    if (error) {
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
        return alert("Registration Error: " + error.message);
    }

    if (data.user) {
        // Gumawa ng initial profile record
        await _supabase.from("students").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: "New Student", 
            student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
            role: "student"
        });
        alert("Registered successfully! You can now login.");
    }
}

// 3. LOGIN FUNCTION (Fixed: No more 'Contact Admin' dead end)
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const captchaToken = getCaptchaToken();
    
    if (!captchaToken) return alert("Please verify the CAPTCHA before logging in!");
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

    // Subukan kunin ang profile
    let { data: profile } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

    // KUNG WALANG PROFILE: Gawan agad siya (imbes na mag-error)
    if (!profile) {
        console.log("No profile found, auto-creating student record...");
        const { data: newProfile, error: createError } = await _supabase
            .from("students")
            .insert({
                user_id: data.user.id,
                email: data.user.email,
                name: data.user.email.split('@')[0], // Temp name galing sa email
                student_no: "STU-" + Math.floor(1000 + Math.random() * 9000),
                role: "student"
            })
            .select()
            .single();

        if (createError) return alert("System Error: Profile creation failed.");
        profile = newProfile;
    }

    // Role-based Redirection
    window.location.href = (profile.role === 'admin') ? 'admin.html' : 'dashboard.html';
}