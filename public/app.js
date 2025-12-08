// =========================
// Animal Tracker Frontend (Database Connected)
// =========================

let animals = [];          // Now serves as a cache for DB data
let editId = null;         // currently editing animal id (null = add mode)
let currentSearch = "";    // search query
let currentPhotoDataUrl = ""; // base64 image for the current form

// ---- DOM references ----
const animalForm = document.getElementById("animalForm");
const animalsTableBody = document.getElementById("animalTableBody");
const searchInput = document.getElementById("searchAnimals");
const deleteAllBtn = document.getElementById("deleteAnimals"); // Note: Bulk delete not supported by API yet
const submitBtn = animalForm ? animalForm.querySelector("button[type='submit']") : null;
const animalPhotoInput = document.getElementById("animalPhoto");
const animalPhotoPreview = document.getElementById("animalPhotoPreview");
const animalGrid = document.getElementById("animalGrid");

// =========================
// 1. API FUNCTIONS (The Connection Logic)
// =========================

// LOAD DATA
async function fetchAnimals() {
    console.log("[Client] Fetching animals from server...");
    try {
        const response = await fetch('/animals');
        
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        
        const result = await response.json();
        console.log(`[Client] Server responded. Found ${result.data.length} animals.`);
        
        animals = result.data; // Update local array with DB data
        rerenderAll();
    } catch (error) {
        console.error("[Client] Error loading animals:", error);
        // Optional: Swal.fire("Connection Error", "Could not talk to the database.", "error");
    }
}

// SAVE DATA
async function saveAnimalToDB(animalData) {
    console.log("[Client] Sending SAVE request to server...");
    try {
        const response = await fetch('/animals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData)
        });

        if (response.ok) {
            console.log("[Client] Save Successful!");
            fetchAnimals(); // Reload data to show the new entry
            return true;
        } else {
            console.error("[Client] Server rejected save:", await response.text());
        }
    } catch (error) { console.error("[Client] Save Network Error:", error); }
    return false;
}

// UPDATE DATA
async function updateAnimalInDB(animalData) {
    console.log("[Client] Sending UPDATE request for ID:", animalData.id);
    try {
        const response = await fetch('/animals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData)
        });

        if (response.ok) {
            console.log("[Client] Update Successful!");
            fetchAnimals(); 
            return true;
        }
    } catch (error) { console.error("[Client] Update Network Error:", error); }
    return false;
}

// DELETE DATA
async function deleteAnimalFromDB(id) {
    console.log("[Client] Sending DELETE request for ID:", id);
    try {
        const response = await fetch('/animals', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        if (response.ok) {
            console.log("[Client] Delete Successful!");
            fetchAnimals(); 
            return true;
        }
    } catch (error) { console.error("[Client] Delete Network Error:", error); }
    return false;
}

// =========================
// 2. FORM & PHOTO HANDLING
// =========================

if (animalPhotoInput) {
  animalPhotoInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (!file) {
      clearPhotoPreview();
      return;
    }
    console.log("[Client] Processing photo selection...");
    const reader = new FileReader();
    reader.onload = function (e) {
      currentPhotoDataUrl = e.target.result; // base64 string
      updatePhotoPreview(currentPhotoDataUrl);
    };
    reader.readAsDataURL(file);
  });
}

function clearPhotoPreview() {
  currentPhotoDataUrl = "";
  if (animalPhotoPreview) {
    animalPhotoPreview.style.display = "none";
    animalPhotoPreview.src = "";
  }
}

function updatePhotoPreview(dataUrl) {
  if (!animalPhotoPreview) return;
  if (!dataUrl) {
    clearPhotoPreview();
    return;
  }
  animalPhotoPreview.src = dataUrl;
  animalPhotoPreview.style.display = "inline-block";
}

function collectFormData() {
  return {
    id: editId, // Include ID if we are editing
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
    photo: currentPhotoDataUrl // Send image data to server
  };
}

function validateFormData(data) {
  if (!data.type) {
    Swal.fire({
      icon: "error",
      title: "Missing Info",
      text: "Please enter the Type of Animal.",
    });
    return false;
  }
  return true;
}

function resetForm() {
  if (!animalForm) return;
  animalForm.reset();

  const sexMaleRadio = document.getElementById("sexMale");
  if (sexMaleRadio) sexMaleRadio.checked = true;

  editId = null;
  if (submitBtn) {
    submitBtn.textContent = "Save Animal (Local)";
    submitBtn.classList.remove("btn-warning");
    submitBtn.classList.add("btn-success");
  }

  if (animalPhotoInput) animalPhotoInput.value = "";
  clearPhotoPreview();
}

// =========================
// 3. EVENT HANDLERS
// =========================

async function handleSubmit(event) {
  event.preventDefault();
  if (!animalForm) return;

  const data = collectFormData();
  if (!validateFormData(data)) return;

  // REPLACED: animals.push() with fetch calls
  if (editId) {
    // Editing existing animal
    const success = await updateAnimalInDB(data);
    if (success) {
        Swal.fire({ icon: "success", title: "Updated", timer: 1500, showConfirmButton: false });
        resetForm();
    }
  } else {
    // Creating new animal
    const success = await saveAnimalToDB(data);
    if (success) {
        Swal.fire({ icon: "success", title: "Saved", text: "Saved to database", timer: 1500, showConfirmButton: false });
        resetForm();
    }
  }
}

function handleEdit(id) {
  const animal = animals.find((a) => a.id === id);
  if (!animal || !animalForm) return;

  console.log("[Client] Loading animal into form:", animal.name);

  // Fill text fields
  const mapping = {
      animalName: "name", animalType: "type", breed: "breed", birthdate: "birthdate",
      weight: "weight", size: "size", animalId: "animalId", location: "location",
      description: "description", notes: "notes", vetName: "vetName",
      visitType: "visitType", visitNotes: "visitNotes", feedingTime: "feedingTime",
      feedingAmount: "feedingAmount", feedingWhat: "feedingWhat"
  };

  for (const [fieldId, dataKey] of Object.entries(mapping)) {
      const el = document.getElementById(fieldId);
      if(el) el.value = animal[dataKey] || "";
  }

  // Sex
  if (animal.sex === "Male") document.getElementById("sexMale").checked = true;
  else if (animal.sex === "Female") document.getElementById("sexFemale").checked = true;

  // Photo
  currentPhotoDataUrl = animal.photo || "";
  updatePhotoPreview(currentPhotoDataUrl);
  if (animalPhotoInput) animalPhotoInput.value = "";

  editId = id;
  if (submitBtn) {
    submitBtn.textContent = "Update Animal";
    submitBtn.classList.remove("btn-success");
    submitBtn.classList.add("btn-warning");
  }

  animalForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleDelete(id) {
  Swal.fire({
    title: "Delete this animal?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
  }).then(async (result) => {
    if (result.isConfirmed) {
        // REPLACED: local filter with DB delete call
        const success = await deleteAnimalFromDB(id);
        if (success) {
            Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
        }
    }
  });
}

// =========================
// 4. RENDERING & UI
// =========================

function getFilteredAnimals() {
  if (!currentSearch) return animals;
  const term = currentSearch.toLowerCase();
  return animals.filter((a) => 
      (a.name || "").toLowerCase().includes(term) ||
      (a.type || "").toLowerCase().includes(term) ||
      (a.breed || "").toLowerCase().includes(term)
  );
}

function renderTable() {
  if (!animalsTableBody) return;
  animalsTableBody.innerHTML = "";
  const list = getFilteredAnimals();

  if (!list.length) {
    animalsTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted fw-bold">No animals in database.</td></tr>`;
    return;
  }

  list.forEach((a) => {
    const tr = document.createElement("tr");
    tr.dataset.id = a.id;

    const photoCellHtml = a.photo
      ? `<img src="${a.photo}" class="img-thumbnail" style="max-width: 60px; max-height: 60px; object-fit: cover;">`
      : `<span class="text-muted">No photo</span>`;

    tr.innerHTML = `
      <td>${photoCellHtml}</td>
      <td>${a.name || "-"}</td>
      <td>${a.type || "-"}</td>
      <td>${a.breed || "-"}</td>
      <td>${a.sex || "-"}</td>
      <td>${a.birthdate || "-"}</td>
      <td>${a.location || "-"}</td>
      <td>${a.animalId || "-"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-edit" type="button" data-id="${a.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger btn-delete" type="button" data-id="${a.id}">Delete</button>
      </td>
    `;
    animalsTableBody.appendChild(tr);
  });
}

function renderCards() {
  if (!animalGrid) return;
  animalGrid.innerHTML = "";
  const list = getFilteredAnimals();

  list.forEach((a) => {
    const displayTitle = a.name || a.type || "Animal";
    const imgSrc = a.photo || "https://placehold.co/300x250?text=No+Image";

    const cardHTML = `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card h-100 shadow-sm animal-card">
          <img src="${imgSrc}" class="card-img-top" alt="${displayTitle}" style="height:200px; object-fit:cover;">
          <div class="card-body">
            <h5 class="card-title">${displayTitle}</h5>
            <p class="card-text text-muted">${a.breed || ""}</p>
            <button class="btn btn-outline-primary btn-sm w-100" type="button" onclick="showAnimalDetails('${a.id}')">See Info</button>
          </div>
        </div>
      </div>
    `;
    animalGrid.insertAdjacentHTML("beforeend", cardHTML);
  });
}

function rerenderAll() {
  renderTable();
  renderCards();
}

function showAnimalDetails(id) {
  const animal = animals.find((a) => a.id === id);
  if (!animal) return;

  const photoHtml = animal.photo
    ? `<div class="mb-3 text-center"><img src="${animal.photo}" style="max-width: 100%; max-height: 250px; border-radius: 8px;"></div>`
    : "";

  Swal.fire({
    title: animal.name || animal.type,
    html: `${photoHtml}
           <div class="text-start">
             <p><strong>Type:</strong> ${animal.type}</p>
             <p><strong>Location:</strong> ${animal.location || "N/A"}</p>
             <p><strong>Notes:</strong> ${animal.notes || "None"}</p>
           </div>`,
    width: 600
  });
}
window.showAnimalDetails = showAnimalDetails;

// =========================
// 5. INITIALIZATION
// =========================

if (animalForm) animalForm.addEventListener("submit", handleSubmit);

if (animalsTableBody) {
  animalsTableBody.addEventListener("click", function (e) {
    const button = e.target.closest("button");
    
    // 1. Handle Edit/Delete Buttons
    if (button) {
      const id = button.getAttribute("data-id");
      if (button.classList.contains("btn-edit")) handleEdit(id);
      if (button.classList.contains("btn-delete")) handleDelete(id);
      return; // Stop here if a button was clicked
    }

    // 2. Handle Row Click (Show Details)
    // This was missing in your file!
    const row = e.target.closest("tr");
    if (row) {
      const id = row.dataset.id;
      if (id) showAnimalDetails(id);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value || "";
    rerenderAll();
  });
}

// IMPORTANT: Load data when page starts
document.addEventListener("DOMContentLoaded", fetchAnimals);