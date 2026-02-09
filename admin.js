// 1️⃣ Supabase setup
const supabase = supabase.createClient(
  "YOUR_PROJECT_URL",  // palitan ng actual project URL
  "YOUR_ANON_KEY"      // palitan ng actual anon key
);

// ---------------------------
// 2️⃣ Load Students & Subjects
// ---------------------------
async function loadStudents() {
  const { data, error } = await supabase.from("students").select("*");
  if (error) return console.error(error);

  const studentSelect = document.getElementById("student");
  studentSelect.innerHTML = ""; // clear previous
  data.forEach(s => {
    const option = document.createElement("option");
    option.value = s.user_id;
    option.innerText = s.name;
    studentSelect.appendChild(option);
  });

  // Edit student dropdown
  const editSelect = document.getElementById("editStudent");
  editSelect.innerHTML = "";
  data.forEach(s => {
    const option = document.createElement("option");
    option.value = s.user_id;
    option.innerText = s.name;
    editSelect.appendChild(option);
  });

  // Auto-fill edit fields when student selected
  editSelect.addEventListener("change", () => {
    const selected = data.find(s => s.user_id === editSelect.value);
    if (selected) {
      document.getElementById("editName").value = selected.name;
      document.getElementById("editEmail").value = selected.email;
      document.getElementById("editRole").value = selected.role;
    }
  });
}

async function loadSubjects() {
  const { data, error } = await supabase.from("subjects").select("*");
  if (error) return console.error(error);

  const subjectSelect = document.getElementById("subject");
  subjectSelect.innerHTML = "";
  data.forEach(s => {
    const option = document.createElement("option");
    option.value = s.id;
    option.innerText = s.subject_name;
    subjectSelect.appendChild(option);
  });

  // Filter subjects
  const filterSelect = document.getElementById("filterSubject");
  filterSelect.innerHTML = '<option value="">All Subjects</option>';
  data.forEach(s => {
    const option = document.createElement("option");
    option.value = s.id;
    option.innerText = s.subject_name;
    filterSelect.appendChild(option);
  });
}

// ---------------------------
// 3️⃣ Add Grade
// ---------------------------
async function addGrade() {
  const student_id = document.getElementById("student").value;
  const subject_id = document.getElementById("subject").value;
  const grade = parseFloat(document.getElementById("grade").value);

  if (!student_id || !subject_id || isNaN(grade)) {
    return alert("Please fill all fields correctly!");
  }

  const { error } = await supabase.from("grades").insert([
    { user_id: student_id, subject_id: subject_id, grade: grade }
  ]);

  if (error) alert(error.message);
  else {
    alert("Grade added successfully!");
    loadGrades();
  }
}

// ---------------------------
// 4️⃣ Load Grades (with filters)
// ---------------------------
async function loadGrades() {
  const subjectFilter = document.getElementById("filterSubject").value;
  const semesterFilter = document.getElementById("filterSemester").value;

  let query = supabase.from("grades")
    .select("grade, semester, subjects(subject_name), students(name)")
    .order("grade", { ascending: true });

  if (subjectFilter) query = query.eq("subject_id", subjectFilter);
  if (semesterFilter) query = query.eq("semester", semesterFilter);

  const { data, error } = await query;
  if (error) return console.error(error);

  const list = document.getElementById("gradeList");
  list.innerHTML = "";
  data.forEach(g => {
    const li = document.createElement("li");
    li.innerText = `${g.students.name} - ${g.subjects.subject_name} (Sem ${g.semester || "-"}) : ${g.grade}`;
    list.appendChild(li);
  });
}

// ---------------------------
// 5️⃣ Update Student Profile
// ---------------------------
async function updateStudent() {
  const studentId = document.getElementById("editStudent").value;
  const name = document.getElementById("editName").value;
  const email = document.getElementById("editEmail").value;
  const role = document.getElementById("editRole").value;

  if (!name || !email) return alert("Name and Email are required!");

  const { error } = await supabase.from("students")
    .update({ name, email, role })
    .eq("user_id", studentId);

  if (error) alert(error.message);
  else {
    alert("Student profile updated!");
    loadStudents(); // refresh dropdowns
    loadGrades();   // optional: refresh grade list if name changed
  }
}

// ---------------------------
// 6️⃣ Initial Load
// ---------------------------
loadStudents();
loadSubjects();
loadGrades();