// =========================
// Animal Tracker Frontend
// =========================

// ---- In-memory data store ----
let animals = [];          // all animals
let editId = null;         // currently editing animal id (null = add mode)
let currentSearch = "";    // search query
let currentPhotoDataUrl = ""; // base64 image for the current form

// ---- DOM references ----
const animalForm = document.getElementById("animalForm");
const animalsTableBody = document.getElementById("animalTableBody");
const searchInput = document.getElementById("searchAnimals");
const deleteAllBtn = document.getElementById("deleteAnimals");
const submitBtn = animalForm
  ? animalForm.querySelector("button[type='submit']")
  : null;

const animalPhotoInput = document.getElementById("animalPhoto");
const animalPhotoPreview = document.getElementById("animalPhotoPreview");

// Optional card/grid container (if you ever add one)
const animalGrid = document.getElementById("animalGrid");

// =========================
// Helpers
// =========================

// Generate a unique id
function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    "a_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

// Clear photo preview
function clearPhotoPreview() {
  currentPhotoDataUrl = "";
  if (animalPhotoPreview) {
    animalPhotoPreview.style.display = "none";
    animalPhotoPreview.src = "";
  }
}

// Update photo preview from data URL
function updatePhotoPreview(dataUrl) {
  if (!animalPhotoPreview) return;
  if (!dataUrl) {
    clearPhotoPreview();
    return;
  }
  animalPhotoPreview.src = dataUrl;
  animalPhotoPreview.style.display = "inline-block";
}

// =========================
// Photo input handling
// =========================
if (animalPhotoInput) {
  animalPhotoInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (!file) {
      clearPhotoPreview();
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      currentPhotoDataUrl = e.target.result; // base64
      updatePhotoPreview(currentPhotoDataUrl);
    };
    reader.readAsDataURL(file);
  });
}

// =========================
// Form helpers
// =========================
function collectFormData() {
  return {
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
    feedingAmount:
      document.getElementById("feedingAmount")?.value.trim() || "",
    feedingWhat: document.getElementById("feedingWhat")?.value.trim() || "",
    // photo is handled via currentPhotoDataUrl
  };
}

function validateFormData(data) {
  if (!data.type) {
    Swal.fire({
      icon: "error",
      title: "Missing required info",
      text: "Please enter the Type of Animal before saving.",
    });
    return false;
  }
  return true;
}

function resetForm() {
  if (!animalForm) return;
  animalForm.reset();

  // Default sex back to Male
  const sexMaleRadio = document.getElementById("sexMale");
  if (sexMaleRadio) sexMaleRadio.checked = true;

  // Reset editing state
  editId = null;
  if (submitBtn) {
    submitBtn.textContent = "Save Animal (Local)";
    submitBtn.classList.remove("btn-warning");
    submitBtn.classList.add("btn-success");
  }

  // Clear photo input & preview
  if (animalPhotoInput) {
    animalPhotoInput.value = "";
  }
  clearPhotoPreview();
}

// =========================
// Filtering
// =========================
function getFilteredAnimals() {
  if (!currentSearch) return animals;
  const term = currentSearch.toLowerCase();
  return animals.filter((a) => {
    return (
      (a.name || "").toLowerCase().includes(term) ||
      (a.type || "").toLowerCase().includes(term) ||
      (a.breed || "").toLowerCase().includes(term) ||
      (a.location || "").toLowerCase().includes(term) ||
      (a.animalId || "").toLowerCase().includes(term) ||
      (a.description || "").toLowerCase().includes(term)
    );
  });
}

// =========================
// Rendering
// =========================
function renderTable() {
  if (!animalsTableBody) return;

  animalsTableBody.innerHTML = "";
  const list = getFilteredAnimals();

  if (!list.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9; // Photo, Name, Type, Breed, Sex, Birthdate, Location, ID, Actions
    td.className = "text-center text-muted fw-bold";
    td.textContent = "No animals saved yet.";
    tr.appendChild(td);
    animalsTableBody.appendChild(tr);
    return;
  }

  list.forEach((a) => {
    const tr = document.createElement("tr");
    tr.dataset.id = a.id;

    const displayTitle = a.name || a.type || "Animal";

    const photoCellHtml = a.photo
      ? `<img 
           src="${a.photo}" 
           alt="Photo of ${displayTitle}"
           class="img-thumbnail"
           style="max-width: 60px; max-height: 60px; object-fit: cover;">
        `
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
        <button 
          class="btn btn-sm btn-outline-primary me-1 btn-edit" 
          type="button"
          data-id="${a.id}">
          Edit
        </button>
        <button 
          class="btn btn-sm btn-outline-danger btn-delete" 
          type="button"
          data-id="${a.id}">
          Delete
        </button>
      </td>
    `;

    animalsTableBody.appendChild(tr);
  });
}

// Optional card view if you add a grid container later
function renderCards() {
  if (!animalGrid) return;
  animalGrid.innerHTML = "";
  const list = getFilteredAnimals();

  list.forEach((a) => {
    const displayTitle = a.name || a.type || "Animal";
    const subtitleParts = [];
    if (a.sex) subtitleParts.push(a.sex);
    if (a.breed) subtitleParts.push(a.breed);
    const subtitle = subtitleParts.join(" | ");

    const imgSrc =
      a.photo ||
      "https://placehold.co/300x250?text=" + encodeURIComponent(displayTitle);

    const cardHTML = `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card h-100 shadow-sm animal-card">
          <img 
            src="${imgSrc}" 
            class="card-img-top" 
            alt="Picture of ${displayTitle}">
          <div class="card-body">
            <h5 class="card-title">${displayTitle}</h5>
            <p class="card-text text-muted">${subtitle || ""}</p>
            <div class="d-grid gap-2">
              <button 
                class="btn btn-outline-primary btn-sm" 
                type="button"
                onclick="showAnimalDetails('${a.id}')">
                See Info
              </button>
            </div>
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

// =========================
// CRUD Handlers
// =========================
function handleSubmit(event) {
  event.preventDefault();
  if (!animalForm) return;

  const data = collectFormData();
  if (!validateFormData(data)) return;

  if (editId) {
    // Update existing animal
    const idx = animals.findIndex((a) => a.id === editId);
    if (idx !== -1) {
      const existing = animals[idx];
      animals[idx] = {
        ...existing,
        ...data,
        // If user picked a new photo, use it; otherwise keep existing
        photo: currentPhotoDataUrl || existing.photo || "",
      };
    }

    Swal.fire({
      icon: "success",
      title: "Animal updated",
      text: "The animal was updated successfully.",
      timer: 1500,
      showConfirmButton: false,
    });
  } else {
    // Create new animal
    const newAnimal = {
      id: generateId(),
      ...data,
      photo: currentPhotoDataUrl || "",
    };
    animals.push(newAnimal);

    Swal.fire({
      icon: "success",
      title: "Animal added",
      text: "The animal was added to your list.",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  resetForm();
  rerenderAll();
}

function handleEdit(id) {
  const animal = animals.find((a) => a.id === id);
  if (!animal || !animalForm) return;

  // Fill form
  const animalNameInput = document.getElementById("animalName");
  if (animalNameInput) animalNameInput.value = animal.name || "";

  const animalTypeInput = document.getElementById("animalType");
  if (animalTypeInput) animalTypeInput.value = animal.type || "";

  const breedInput = document.getElementById("breed");
  if (breedInput) breedInput.value = animal.breed || "";

  const birthdateInput = document.getElementById("birthdate");
  if (birthdateInput) birthdateInput.value = animal.birthdate || "";

  const weightInput = document.getElementById("weight");
  if (weightInput) weightInput.value = animal.weight || "";

  const sizeInput = document.getElementById("size");
  if (sizeInput) sizeInput.value = animal.size || "";

  const animalIdInput = document.getElementById("animalId");
  if (animalIdInput) animalIdInput.value = animal.animalId || "";

  const locationInput = document.getElementById("location");
  if (locationInput) locationInput.value = animal.location || "";

  const descriptionInput = document.getElementById("description");
  if (descriptionInput) descriptionInput.value = animal.description || "";

  const notesInput = document.getElementById("notes");
  if (notesInput) notesInput.value = animal.notes || "";

  const vetNameInput = document.getElementById("vetName");
  if (vetNameInput) vetNameInput.value = animal.vetName || "";

  const visitTypeSelect = document.getElementById("visitType");
  if (visitTypeSelect) visitTypeSelect.value = animal.visitType || "";

  const visitNotesInput = document.getElementById("visitNotes");
  if (visitNotesInput) visitNotesInput.value = animal.visitNotes || "";

  const feedingTimeInput = document.getElementById("feedingTime");
  if (feedingTimeInput) feedingTimeInput.value = animal.feedingTime || "";

  const feedingAmountInput = document.getElementById("feedingAmount");
  if (feedingAmountInput) feedingAmountInput.value =
    animal.feedingAmount || "";

  const feedingWhatInput = document.getElementById("feedingWhat");
  if (feedingWhatInput) feedingWhatInput.value = animal.feedingWhat || "";

  // Sex radios
  const sexMale = document.getElementById("sexMale");
  const sexFemale = document.getElementById("sexFemale");
  if (animal.sex === "Male" && sexMale) {
    sexMale.checked = true;
  } else if (animal.sex === "Female" && sexFemale) {
    sexFemale.checked = true;
  }

  // Photo
  currentPhotoDataUrl = animal.photo || "";
  updatePhotoPreview(currentPhotoDataUrl);
  if (animalPhotoInput) {
    animalPhotoInput.value = "";
  }

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
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      animals = animals.filter((a) => a.id !== id);
      rerenderAll();
      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  });
}

function handleDeleteAll() {
  if (!animals.length) return;
  Swal.fire({
    title: "Delete ALL animals?",
    text: "This will clear your current session list.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete all",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      animals = [];
      rerenderAll();
      Swal.fire({
        icon: "success",
        title: "All animals deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  });
}

// =========================
// Details popup (SweetAlert)
// =========================
function showAnimalDetails(id) {
  const animal = animals.find((a) => a.id === id);
  if (!animal) {
    Swal.fire({
      title: "Animal Details",
      text: "Details not found for this animal.",
      icon: "info",
    });
    return;
  }

  const titleText = animal.name || animal.type || "Animal";

  const photoHtml = animal.photo
    ? `<div class="mb-3 text-center">
         <img src="${animal.photo}" alt="Photo of ${
        animal.type || "animal"
      }"
              style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 0.5rem;">
       </div>`
    : "";

  const detailsHtml = `
    ${photoHtml}
    <p><strong>Type:</strong> ${animal.type || "-"}</p>
    <p><strong>Breed:</strong> ${animal.breed || "-"}</p>
    <p><strong>Sex:</strong> ${animal.sex || "-"}</p>
    <p><strong>Birthdate:</strong> ${animal.birthdate || "-"}</p>
    <p><strong>Weight:</strong> ${animal.weight || "-"}</p>
    <p><strong>Size:</strong> ${animal.size || "-"}</p>
    <p><strong>Animal ID:</strong> ${animal.animalId || "-"}</p>
    <p><strong>Location:</strong> ${animal.location || "-"}</p>
    <hr>
    <p><strong>Vet Name:</strong> ${animal.vetName || "-"}</p>
    <p><strong>Visit Type:</strong> ${animal.visitType || "-"}</p>
    <p><strong>Visit Notes:</strong> ${animal.visitNotes || "-"}</p>
    <hr>
    <p><strong>Feeding Time:</strong> ${animal.feedingTime || "-"}</p>
    <p><strong>Feeding Amount:</strong> ${
      animal.feedingAmount || "-"
    }</p>
    <p><strong>Feeding What:</strong> ${animal.feedingWhat || "-"}</p>
    <hr>
    <p><strong>Description:</strong> ${animal.description || "-"}</p>
    <p><strong>Notes:</strong> ${animal.notes || "-"}</p>
  `;

  Swal.fire({
    title: titleText,
    html: detailsHtml,
    icon: "info",
    width: 600,
  });
}

// expose for cards / manual calls if needed
window.showAnimalDetails = showAnimalDetails;

// =========================
// Event listeners
// =========================
if (animalForm) {
  animalForm.addEventListener("submit", handleSubmit);
}

if (animalsTableBody) {
  animalsTableBody.addEventListener("click", function (e) {
    const button = e.target.closest("button");
    if (button) {
      const id = button.getAttribute("data-id");
      if (!id) return;

      if (button.classList.contains("btn-edit")) {
        handleEdit(id);
      } else if (button.classList.contains("btn-delete")) {
        handleDelete(id);
      }
      return;
    }

    // Clicking on the row (not a button) shows details
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
    if (id) {
      showAnimalDetails(id);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", function (e) {
    currentSearch = e.target.value || "";
    rerenderAll();
  });
}

if (deleteAllBtn) {
  deleteAllBtn.addEventListener("click", function () {
    handleDeleteAll();
  });
}

// Initial render
rerenderAll();

