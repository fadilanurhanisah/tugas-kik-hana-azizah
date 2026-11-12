
const $ = id => document.getElementById(id);

let currentPhoto = "";
let currentStudentId = null;

const accounts = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "siswa", password: "siswa123", role: "student" }
];

function getStudents() {
  try {
    return JSON.parse(localStorage.getItem("ruangDataStudents")) || [];
  } catch {
    return [];
  }
}

function saveStudents(data) {
  localStorage.setItem("ruangDataStudents", JSON.stringify(data));
}

// LOGIN
$("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;

  const account = accounts.find(item =>
    item.username === username && item.password === password
  );

  if (!account) {
    $("loginMessage").textContent = "Username atau password salah.";
    return;
  }

  $("loginPage").classList.add("hidden");

  if (account.role === "admin") {
    $("adminPage").classList.remove("hidden");
    renderDashboard();
  } else {
    $("studentPage").classList.remove("hidden");
    loadStudentForm();
    renderStudentDashboard();
    showStudentSection("studentDashboard");
  }
});

// LOGOUT
function logout() {
  $("loginPage").classList.remove("hidden");
  $("studentPage").classList.add("hidden");
  $("adminPage").classList.add("hidden");
  $("loginForm").reset();
  $("loginMessage").textContent = "";
  closeDetail();
}

// NAVIGASI SISWA
function showStudentSection(sectionId) {
  document.querySelectorAll("#studentPage .page-section").forEach(section => {
    section.classList.add("hidden");
  });

  $(sectionId).classList.remove("hidden");

  document.querySelectorAll("#studentPage .nav-button").forEach(button => {
    button.classList.remove("active");
  });

  const index = sectionId === "studentDashboard" ? 0 : 1;
  document.querySelectorAll("#studentPage .nav-button")[index].classList.add("active");
}

// NAVIGASI ADMIN
function showAdminSection(sectionId) {
  document.querySelectorAll("#adminPage .page-section").forEach(section => {
    section.classList.add("hidden");
  });

  $(sectionId).classList.remove("hidden");

  document.querySelectorAll("#adminPage .nav-button").forEach(button => {
    button.classList.remove("active");
  });

  const index = sectionId === "adminDashboard" ? 0 : 1;
  document.querySelectorAll("#adminPage .nav-button")[index].classList.add("active");

  if (sectionId === "adminDataSection") {
    $("searchStudent").value = "";
    renderStudents();
  }
}

// DASHBOARD SISWA
function renderStudentDashboard() {
  const student = getStudents().find(item => item.username === "siswa");

  $("studentStatus").textContent = student ? "Sudah Diisi" : "Belum Diisi";
  $("studentLocationStatus").textContent =
    student && student.mapLink ? "Tersedia" : "Belum Ada";
}

// FORM SISWA
function loadStudentForm() {
  const student = getStudents().find(item => item.username === "siswa");

  if (!student) {
    currentStudentId = null;
    $("studentForm").reset();
    currentPhoto = "";
    $("photoPreview").classList.add("hidden");
    return;
  }

  currentStudentId = student.id;

  [
    "studentName", "nis", "className", "phone",
    "fatherName", "fatherJob", "motherName", "motherJob",
    "familyStatus", "income", "address", "mapLink"
  ].forEach(field => {
    $(field).value = student[field] || "";
  });

  currentPhoto = student.photo || "";

  if (currentPhoto) {
    $("photoPreview").src = currentPhoto;
    $("photoPreview").classList.remove("hidden");
  } else {
    $("photoPreview").classList.add("hidden");
  }
}

// PREVIEW FOTO
$("housePhoto").addEventListener("change", function(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Pilih file gambar.");
    event.target.value = "";
    return;
  }

  if (file.size > 1024 * 1024) {
    alert("Ukuran foto maksimal 1 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    currentPhoto = e.target.result;
    $("photoPreview").src = currentPhoto;
    $("photoPreview").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
});

// VALIDASI GOOGLE MAPS
function isGoogleMapsLink(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    const validHost = [
      "maps.google.com",
      "google.com",
      "www.google.com",
      "maps.app.goo.gl"
    ].includes(host);

    const validPath =
      host === "maps.app.goo.gl" ||
      host === "maps.google.com" ||
      url.pathname.startsWith("/maps");

    return url.protocol === "https:" && validHost && validPath;
  } catch {
    return false;
  }
}

// SIMPAN DATA
$("studentForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const mapLink = $("mapLink").value.trim();

  if (!isGoogleMapsLink(mapLink)) {
    $("studentMessage").textContent = "Masukkan link Google Maps yang benar.";
    return;
  }

  const students = getStudents();

  const student = {
    id: currentStudentId || Date.now(),
    username: "siswa",
    studentName: $("studentName").value.trim(),
    nis: $("nis").value.trim(),
    className: $("className").value.trim(),
    phone: $("phone").value.trim(),
    fatherName: $("fatherName").value.trim(),
    fatherJob: $("fatherJob").value.trim(),
    motherName: $("motherName").value.trim(),
    motherJob: $("motherJob").value.trim(),
    familyStatus: $("familyStatus").value,
    income: $("income").value,
    address: $("address").value.trim(),
    mapLink,
    photo: currentPhoto
  };

  const index = students.findIndex(item => item.username === "siswa");

  if (index >= 0) {
    students[index] = student;
  } else {
    students.push(student);
  }

  saveStudents(students);
  currentStudentId = student.id;

  $("studentMessage").textContent = "Data berhasil disimpan!";
  renderStudentDashboard();
  alert("Data berhasil disimpan!");
});

// DASHBOARD ADMIN
function renderDashboard() {
  const students = getStudents();

  $("totalStudents").textContent = students.length;
  $("completedStudents").textContent = students.length;
  $("locationCount").textContent =
    students.filter(student => isGoogleMapsLink(student.mapLink || "")).length;

  const recent = $("recentStudents");
  recent.innerHTML = "";

  if (students.length === 0) {
    recent.textContent = "Belum ada data siswa yang masuk.";
    return;
  }

  students.slice(-5).reverse().forEach(student => {
    const item = document.createElement("div");
    item.className = "detail-item";
    item.textContent = `${student.studentName} — ${student.className}`;
    recent.appendChild(item);
  });
}

// TABEL ADMIN
function renderStudents(keyword = "") {
  const students = getStudents().filter(student =>
    (student.studentName || "").toLowerCase().includes(keyword.toLowerCase()) ||
    (student.nis || "").toLowerCase().includes(keyword.toLowerCase())
  );

  const table = $("studentTable");
  table.innerHTML = "";

  if (students.length === 0) {
    table.innerHTML = `<tr><td colspan="5">Data siswa belum tersedia.</td></tr>`;
    return;
  }

  students.forEach(student => {
    const row = document.createElement("tr");

    [
      student.studentName,
      student.nis,
      student.className,
      student.income
    ].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value || "-";
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const button = document.createElement("button");

    button.className = "detail-button";
    button.textContent = "Detail";
    button.addEventListener("click", () => openDetail(student.id));

    actionCell.appendChild(button);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

// PENCARIAN
$("searchStudent").addEventListener("input", function() {
  renderStudents(this.value);
});

// DETAIL SISWA
function openDetail(id) {
  const student = getStudents().find(item => item.id === id);

  if (!student) return;

  const container = $("detailContent");
  container.innerHTML = "";

  const items = [
    ["Nama Lengkap", student.studentName],
    ["NIS", student.nis],
    ["Kelas", student.className],
    ["Nomor HP", student.phone],
    ["Nama Ayah", student.fatherName],
    ["Pekerjaan Ayah", student.fatherJob],
    ["Nama Ibu", student.motherName],
    ["Pekerjaan Ibu", student.motherJob],
    ["Status Keluarga", student.familyStatus],
    ["Penghasilan Orang Tua", student.income],
    ["Alamat Rumah", student.address]
  ];

  items.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "detail-item";

    const title = document.createElement("strong");
    title.textContent = label;

    const content = document.createElement("span");
    content.textContent = value || "-";

    item.append(title, content);
    container.appendChild(item);
  });

  const mapItem = document.createElement("div");
  mapItem.className = "detail-item";

  const mapTitle = document.createElement("strong");
  mapTitle.textContent = "Lokasi Rumah";

  mapItem.appendChild(mapTitle);

  if (isGoogleMapsLink(student.mapLink || "")) {
    const link = document.createElement("a");
    link.href = student.mapLink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "map-link";
    link.textContent = "Buka Lokasi di Google Maps";
    mapItem.appendChild(link);
  } else {
    mapItem.append("Link lokasi belum tersedia.");
  }

  container.appendChild(mapItem);

  if (student.photo) {
    const title = document.createElement("h3");
    title.textContent = "Foto Rumah";

    const photo = document.createElement("img");
    photo.src = student.photo;
    photo.alt = "Foto rumah siswa";
    photo.className = "detail-photo";

    container.append(title, photo);
  }

  $("detailModal").classList.remove("hidden");
}

function closeDetail() {
  $("detailModal").classList.add("hidden");
}
 