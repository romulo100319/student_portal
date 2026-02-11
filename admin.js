const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- 1. SECURITY GUARD (Check if Admin) ---
async function checkAdmin() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const { data: profile } = await _supabase
        .from("students")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert("Unauthorized! Redirecting to student dashboard.");
        window.location.href = 'dashboard.html';
    }
}

// --- 2. AUDIT LOG HELPER ---
async function logAction(action, targetId, details) {
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: action,
        target_student_id: targetId,
        details: details
    });
}

// --- 3. DATA LOADERS ---
async function loadInitialData() {
    // Load Students for dropdowns
    const { data: students } = await _supabase.from("students").select("*");
    const studentSelect = document.getElementById("student");
    const editSelect = document.getElementById("editStudent");
    
    studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
    editSelect.innerHTML = '<option value="">-- Choose Student --</option>';

    students?.forEach(s => {
        const opt = `<option value="${s.user_id}">${s.name}</option>`;
        studentSelect.innerHTML += opt;
        editSelect.innerHTML += opt;
    });

    // Load Subjects
    const { data: subjects } = await _supabase.from("subjects").select("*");
    const subjectSelect = document.getElementById("subject");
    const filterSub = document.getElementById("filterSubject");

    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjects?.forEach(sub => {
        const opt = `<option value="${sub.id}">${sub.subject_name}</option>`;
        subjectSelect.innerHTML += opt;
        filterSub.innerHTML += opt;
    });

    // Auto-fill Edit Fields
    editSelect.addEventListener("change", () => {
        const selected = students.find(s => s.user_id === editSelect.value);
        if (selected) {
            document.getElementById("editName").value = selected.name;
            document.getElementById("editEmail").value = selected.email;
            document.getElementById("editRole").value = selected.role;
        }
    });
}

// --- 4. CORE ACTIONS ---
async function addGrade() {
    const student_id = document.getElementById("student").value;
    const subject_id = document.getElementById("subject").value;
    const grade = document.getElementById("grade").value;

    if (!student_id || !subject_id || !grade) return alert("Fill all fields!");

    const { error } = await _supabase.from("grades").insert({ 
        user_id: student_id, 
        subject_id: subject_id, 
        grade: parseFloat(grade) 
    });

    if (error) alert(error.message);
    else {
        await logAction("ADD_GRADE", student_id, `Grade ${grade} added to subject ${subject_id}`);
        alert("Grade Record Added!");
        loadGrades();
    }
}

async function updateStudent() {
    const userId = document.getElementById("editStudent").value;
    const name = document.getElementById("editName").value;
    const email = document.getElementById("editEmail").value;
    const role = document.getElementById("editRole").value;

    const { error } = await _supabase.from("students")
        .update({ name, email, role })
        .eq("user_id", userId);

    if (error) alert(error.message);
    else {
        await logAction("UPDATE_PROFILE", userId, `Updated to Name: ${name}, Role: ${role}`);
        alert("Profile Updated Successfully!");
        loadInitialData();
    }
}

// --- 5. LOGS & FILTERS ---
async function fetchAuditLogs() {
    const tbody = document.getElementById("logTableBody");
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Loading...</td></tr>";

    const { data: logs, error } = await _supabase
        .from("audit_logs")
        .select(`action, details, created_at, students!target_student_id(name)`)
        .order("created_at", { ascending: false });

    if (error) return console.error(error);

    tbody.innerHTML = "";
    logs.forEach(log => {
        const row = `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;"><b>${log.action}</b></td>
                <td style="padding: 10px;">${log.students?.name || 'N/A'}</td>
                <td style="padding: 10px;">${log.details}</td>
                <td style="padding: 10px;">${new Date(log.created_at).toLocaleDateString()}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function logout() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}

// --- STARTUP ---
checkAdmin();
loadInitialData();