// 1. Configuration - Gamitin ang '_supabase' para iwas conflict
const supabaseUrl = "https://nrlsgrzqpduzzzphkhtn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHNncnpxcGR1enp6cGhraHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYwNjQsImV4cCI6MjA4NjIwMjA2NH0.oQj3f76HaEHtweWu7vKTr1Atc1XYFq8gffv9eIO78Mc";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Protection & Audit Helper
async function logAction(action, targetId, details) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    await _supabase.from("audit_logs").insert({
        action: action,
        target_student_id: targetId,
        details: details
    });
    fetchAuditLogs(); 
}

// 3. Add Grade with Logging
async function addGrade() {
    const student_id = document.getElementById("student").value; // 'id' sa DB
    const subject_id = document.getElementById("subject").value;
    const grade = document.getElementById("grade").value;

    if (!student_id || !subject_id || !grade) return alert("Pakisagutan lahat ng fields!");

    const { error } = await _supabase.from("grades").insert({ 
        user_id: student_id, // Match sa database schema mo
        subject_id: subject_id,
        grade: grade 
    });
    
    if (error) {
        alert("Error: " + error.message);
    } else {
        await logAction("ADD_GRADE", student_id, `Added grade ${grade} for subject ID: ${subject_id}`);
        alert("Grade Added & Logged!");
        // loadGrades(); // Siguraduhing may function ka nito
    }
}

// 4. Update Profile with Logging
async function updateStudent() {
    const studentId = document.getElementById("editStudent").value;
    const name = document.getElementById("editName").value;
    const role = document.getElementById("editRole").value;

    const { error } = await _supabase.from("students")
        .update({ name, role })
        .eq("id", studentId); // FIX: 'id' dapat, hindi 'user_id'

    if (error) {
        alert(error.message);
    } else {
        await logAction("UPDATE_PROFILE", studentId, `Updated name to ${name} and role to ${role}`);
        alert("Profile Updated & Logged!");
        loadData();
    }
}

// 5. Fetch and Display Audit Logs
async function fetchAuditLogs() {
    const { data, error } = await _supabase
        .from("audit_logs")
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    const logTableBody = document.getElementById("logTableBody");
    if (logTableBody) {
        logTableBody.innerHTML = data.map(log => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${log.action}</td>
                <td style="padding: 10px;">${log.target_student_id}</td>
                <td style="padding: 10px;">${log.details}</td>
                <td style="padding: 10px;">${new Date(log.created_at).toLocaleString()}</td>
            </tr>
        `).join('');
    }
}

// 6. Initial Load Data
async function loadData() {
    // Load Students - FIX: 'id' ang gamit sa table
    const { data: students } = await _supabase.from("students").select("id, name");
    const studentSelects = [document.getElementById("student"), document.getElementById("editStudent")];
    
    if (students) {
        studentSelects.forEach(select => {
            if (!select) return;
            select.innerHTML = students.map(s => `<option value="${s.id}">${s.name || s.id}</option>`).join('');
        });
    }

    // Load Subjects
    const { data: subjects } = await _supabase.from("subjects").select("id, name");
    const subjectSelects = [document.getElementById("subject"), document.getElementById("filterSubject")];
    
    if (subjects) {
        subjectSelects.forEach(select => {
            if (!select) return;
            select.innerHTML = subjects.map(sub => `<option value="${sub.id}">${sub.name}</option>`).join('');
        });
    }
}

// 7. Logout
async function logout() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}

window.onload = () => {
    loadData();
    fetchAuditLogs();
};