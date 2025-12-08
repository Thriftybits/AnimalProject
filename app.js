// =========================
// Animal Tracker Frontend
// =========================

let animals = [];          // This will now hold data from the DB
let editId = null;         // ID of animal currently being edited
let currentSearch = "";    
let currentPhotoDataUrl = ""; 

// ---- DOM references ----
const animalForm = document.getElementById("animalForm");
const animalsTableBody = document.getElementById("animalTableBody");
const searchInput = document.getElementById("searchAnimals");
const submitBtn = animalForm ? animalForm.querySelector("button[type='submit']") : null;
const animalPhotoInput = document.getElementById("animalPhoto");
const animalPhotoPreview = document.getElementById("animalPhotoPreview");

// =========================
// 1. API FUNCTIONS (The Bridge to the Database)
// =========================

// LOAD from Database
async function fetchAnimals() {
    try {
        const response = await fetch('/animals');
        if (!response.ok) throw new Error("Failed to fetch");
        
        const result = await response.json();
        animals = result.data; // Store DB data in our local array
        renderTable(); // Update the screen
    } catch (error) {
        console.error("Error loading animals:", error);
        // Optional: Swal.fire("Error", "Could not connect to server.", "error");
    }
}

// SAVE to Database
async function saveAnimalToDB(animalData) {
    try {
        const response = await fetch('/animals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData)
        });
        if (response.ok) {
            fetchAnimals(); // Reload list to show new animal
            return true;
        }
    } catch (error) { console.error("Error saving:", error); }
    return false;
}

// UPDATE in Database
async function updateAnimalInDB(animalData) {
    try {
        const response = await fetch('/animals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData)
        });
        if (response.ok) {
            fetchAnimals(); 
            return true;
        }
    } catch (error) { console.error("Error updating:", error); }
    return false;
}

// DELETE from Database
async function deleteAnimalFromDB(id) {
    try {
        const response = await fetch('/animals', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        if (response.ok) {
            fetchAnimals();
            return true;
        }
    } catch (error) { console.error("Error deleting:", error); }
    return false;
}

// =========================
// 2. FORM & PHOTO HANDLING
// =========================

// Photo Preview Logic
if (animalPhotoInput) {
  animalPhotoInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (!file) { clearPhotoPreview(); return; }
    
    const reader = new FileReader();
    reader.onload = function (e) {
      currentPhotoDataUrl = e.target.result; // Convert image to text string
      updatePhotoPreview(currentPhotoDataUrl);
    };
    reader.readAsDataURL(file);
  });
}

function updatePhotoPreview(dataUrl) {
  if (!animalPhotoPreview) return;
  if (!dataUrl) { clearPhotoPreview(); return; }
  animalPhotoPreview.src = dataUrl;
  animalPhotoPreview.style.display = "inline-block";
}

function clearPhotoPreview() {
  currentPhotoDataUrl = "";
  if (animalPhotoPreview) {
    animalPhotoPreview.style.display = "none";
    animalPhotoPreview.src = "";
  }
}

function collectFormData() {
  return {
    id: editId,
    name: document.getElementById("animalName")?.value.trim() || "",
    type: document.getElementById("animalType")?.value.trim() || "",
    breed: document.getElementById("breed")?.value.trim() || "",
    sex: document.querySelector("input[name='sex']:checked")?.value || "",
    birthdate: document.getElementById("birthdate")?.value || "",
    weight: document.getElementById("weight")?.value.trim() || "",
    size: document.getElementById("size")?.value.trim() || "",
    animalId: document.getElementById("animalId")?.value.trim() || "",
    location: document.getElementById("location")?.value.trim() || "",
    description: document.getElementById("description")?.value.trim() || "",
    notes: document.getElementById("notes")?.value.trim() || "",
    vetName: document.getElementById("vetName")?.value.trim() || "",
    visitType: document.getElementById("visitType")?.value || "",
    visitNotes: document.getElementById("visitNotes")?.value.trim() || "",
    feedingTime: document.getElementById("feedingTime")?.value || "",
    feedingAmount: document.getElementById("feedingAmount")?.value.trim() || "",
    feedingWhat: document.getElementById("feedingWhat")?.value.trim() || "",
    photo: currentPhotoDataUrl // This sends the image data
  };
}

// Reset form to "Add" state
function resetForm() {
  if (!animalForm) return;
  animalForm.reset();
  editId = null;
  
  const sexMale = document.getElementById("sexMale");
  if (sexMale) sexMale.checked = true;

  if (submitBtn) {
    submitBtn.textContent = "Save Animal";
    submitBtn.classList.remove("btn-warning");
    submitBtn.classList.add("btn-success");
  }
  
  if (animalPhotoInput) animalPhotoInput.value = "";
  clearPhotoPreview();
}

// =========================
// 3. MAIN LOGIC (Submit, Edit, Delete)
// =========================

async function handleSubmit(event) {
  event.preventDefault();
  
  // Validation
  const typeField = document.getElementById("animalType");
  if (!typeField || !typeField.value.trim()) {
    Swal.fire({ icon: "error", title: "Missing Info", text: "Please enter the Type of Animal." });
    return;
  }

  const data = collectFormData();

  if (editId) {
    // EDIT MODE
    const success = await updateAnimalInDB(data);
    if (success) {
        Swal.fire({ icon: "success", title: "Updated", text: "Animal updated successfully.", timer: 1500, showConfirmButton: false });
        resetForm();
    }
  } else {
    // ADD MODE
    const success = await saveAnimalToDB(data);
    if (success) {
        Swal.fire({ icon: "success", title: "Saved", text: "Animal added to database.", timer: 1500, showConfirmButton: false });
        resetForm();
    }
  }
}

function handleEdit(id) {
  const animal = animals.find((a) => a.id === id);
  if (!animal) return;

  // Fill text fields
  const fields = ["animalName", "animalType", "breed", "birthdate", "weight", "size", "animalId", 
                  "location", "description", "notes", "vetName", "visitType", "visitNotes", 
                  "feedingTime", "feedingAmount", "feedingWhat"];
  
  fields.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if(el) el.value = animal[fieldId.replace("animal", "").toLowerCase()] || animal[fieldId] || "";
      // Special fix for mapping 'name' to 'animalName' and 'type' to 'animalType'
      if(fieldId === "animalName") el.value = animal.name || "";
      if(fieldId === "animalType") el.value = animal.type || "";
  });

  // Radios
  if (animal.sex === "Male") document.getElementById("sexMale").checked = true;
  if (animal.sex === "Female") document.getElementById("sexFemale").checked = true;

  // Photo
  currentPhotoDataUrl = animal.photo || "";
  updatePhotoPreview(currentPhotoDataUrl);

  // Set Edit Mode
  editId = id;
  if (submitBtn) {
    submitBtn.textContent = "Update Animal";
    submitBtn.classList.remove("btn-success");
    submitBtn.classList.add("btn-warning");
  }
  
  animalForm.scrollIntoView({ behavior: "smooth" });
}

function handleDelete(id) {
  Swal.fire({
    title: "Delete this animal?",
    text: "This cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete"
  }).then(async (result) => {
    if (result.isConfirmed) {
      const success = await deleteAnimalFromDB(id);
      if (success) {
          Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
      }
    }
  });
}

// =========================
// 4. RENDERING (Table)
// =========================

function getFilteredAnimals() {
  if (!currentSearch) return animals;
  const term = currentSearch.toLowerCase();
  return animals.filter(a => 
    (a.name || "").toLowerCase().includes(term) ||
    (a.type || "").toLowerCase().includes(term) ||
    (a.breed || "").toLowerCase().includes(term)
  );
}

function renderTable() {
  if (!animalsTableBody) return;
  animalsTableBody.innerHTML = "";
  
  const list = getFilteredAnimals();

  if (list.length === 0) {
    animalsTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No animals found.</td></tr>`;
    return;
  }

  list.forEach((a) => {
    const tr = document.createElement("tr");
    
    // Photo Thumbnail
    const photoHtml = a.photo 
        ? `<img src="${a.photo}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` 
        : `<span class="text-muted small">No Img</span>`;

    tr.innerHTML = `
      <td>${photoHtml}</td>
      <td>${a.name || "-"}</td>
      <td>${a.type || "-"}</td>
      <td>${a.breed || "-"}</td>
      <td>${a.sex || "-"}</td>
      <td>${a.birthdate || "-"}</td>
      <td>${a.location || "-"}</td>
      <td>${a.animalId || "-"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-id="${a.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${a.id}">Delete</button>
      </td>
    `;
    animalsTableBody.appendChild(tr);
  });
}

// =========================
// 5. EVENT LISTENERS & INIT
// =========================

if (animalForm) animalForm.addEventListener("submit", handleSubmit);

if (animalsTableBody) {
  animalsTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    
    if (btn.classList.contains("btn-edit")) handleEdit(id);
    if (btn.classList.contains("btn-delete")) handleDelete(id);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    renderTable();
  });
}

// Load data when page opens
document.addEventListener("DOMContentLoaded", fetchAnimals);