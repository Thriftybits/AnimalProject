// =========================
// Shared Elements
// =========================

// Form + table + grid elements
const animalForm = document.getElementById("animalForm");
const animalsTableBody = document.querySelector("#animalsTable tbody");
const submitBtn = animalForm.querySelector("button[type='submit']");
const animalGrid = document.getElementById("animalGrid");

// If you're using a Bootstrap modal for this form
const addAnimalModalElement = document.getElementById("addAnimalModal");

// Local array to store animals in memory
let animals = [];
let editId = null; // null = add mode, not editing

// =========================
// Helpers
// =========================

// Simple unique id
function generateId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000);
}

// Collect data from form fields
function collectFormData() {
  return {
    type: document.getElementById("animalType").value.trim(),
    breed: document.getElementById("breed").value.trim(),
    sex: document.querySelector("input[name='sex']:checked")?.value || "",
    birthdate: document.getElementById("birthdate").value,
    weight: document.getElementById("weight").value.trim(),
    size: document.getElementById("size").value.trim(),
    animalId: document.getElementById("animalId").value.trim(),
    location: document.getElementById("location").value.trim(),
    description: document.getElementById("description").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    vetName: document.getElementById("vetName").value.trim(),
    visitType: document.getElementById("visitType").value,
    visitNotes: document.getElementById("visitNotes").value.trim(),
    feedingTime: document.getElementById("feedingTime").value,
    feedingAmount: document.getElementById("feedingAmount").value.trim(),
    feedingWhat: document.getElementById("feedingWhat").value.trim(),
  };
}

// Reset form back to "add" mode
function resetForm() {
  animalForm.reset();
  editId = null;

  submitBtn.textContent = "Save Animal (Local)";
  submitBtn.classList.remove("btn-warning");
  submitBtn.classList.add("btn-success");
}

// =========================
// Rendering (Table + Cards)
// =========================

// Render the table rows
function renderTable() {
  if (!animalsTableBody) return;

  animalsTableBody.innerHTML = "";

  animals.forEach((a) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.type || "-"}</td>
      <td>${a.breed || "-"}</td>
      <td>${a.sex || "-"}</td>
      <td>${a.birthdate || "-"}</td>
      <td>${a.location || "-"}</td>
      <td>${a.animalId || "-"}</td>
      <td>
        <button 
          class="btn btn-sm btn-outline-primary me-1 btn-edit" 
          data-id="${a.id}">
          Edit
        </button>
        <button 
          class="btn btn-sm btn-outline-danger btn-delete" 
          data-id="${a.id}">
          Delete
        </button>
      </td>
    `;
    animalsTableBody.appendChild(tr);
  });
}

// Render the card grid (from first code snippet)
function renderCards() {
  if (!animalGrid) return;

  animalGrid.innerHTML = "";

  animals.forEach((a) => {
    const type = a.type || "Animal";
    const breed = a.breed || "";
    const sex = a.sex || "";
    const separator = sex && breed ? " | " : "";

    const cardHTML = `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card h-100 shadow-sm animal-card">
          <img src="https://placehold.co/300x250?text=${encodeURIComponent(
            type
          )}" class="card-img-top" alt="Picture of a ${type}">
          <div class="card-body">
            <h5 class="card-title">${type}</h5>
            <p class="card-text text-muted">${sex}${separator}${breed}</p>
            <div class="d-grid gap-2">
              <button 
                class="btn btn-outline-primary btn-sm" 
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

// Render everything from the animals array
function renderUI() {
  renderTable();
  renderCards();
}

// =========================
// CRUD Functions
// =========================

// Add new animal
function addAnimal() {
  const animal = collectFormData();
  animal.id = generateId();
  animals.push(animal);
  renderUI();
}

// Update an existing animal
function updateAnimal(id) {
  const index = animals.findIndex((a) => a.id === id);
  if (index === -1) return;

  const updated = collectFormData();
  updated.id = id;
  animals[index] = updated;
  renderUI();
}

// Handle Edit button
function handleEdit(id) {
  const animal = animals.find((a) => a.id === id);
  if (!animal) return;

  // Fill the form with selected animal data
  document.getElementById("animalType").value = animal.type;
  document.getElementById("breed").value = animal.breed;
  document.getElementById("birthdate").value = animal.birthdate;
  document.getElementById("weight").value = animal.weight;
  document.getElementById("size").value = animal.size;
  document.getElementById("animalId").value = animal.animalId;
  document.getElementById("location").value = animal.location;
  document.getElementById("description").value = animal.description;
  document.getElementById("notes").value = animal.notes;
  document.getElementById("vetName").value = animal.vetName;
  document.getElementById("visitType").value = animal.visitType || "";
  document.getElementById("visitNotes").value = animal.visitNotes;
  document.getElementById("feedingTime").value = animal.feedingTime;
  document.getElementById("feedingAmount").value = animal.feedingAmount;
  document.getElementById("feedingWhat").value = animal.feedingWhat;

  // Sex
  if (animal.sex === "Male") {
    document.getElementById("sexMale").checked = true;
  } else if (animal.sex === "Female") {
    document.getElementById("sexFemale").checked = true;
  }

  editId = id;

  // Change button text
  submitBtn.textContent = "Update Animal";
  submitBtn.classList.remove("btn-success");
  submitBtn.classList.add("btn-warning");

  document.getElementById("animalType").focus();
}

// Delete button with SweetAlert
function handleDelete(id) {
  const animal = animals.find((a) => a.id === id);
  const label = animal?.type || "this animal";

  Swal.fire({
    title: "Delete Animal?",
    text: `Are you sure you want to delete ${label}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      animals = animals.filter((a) => a.id !== id);
      renderUI();

      // If we were editing this animal, reset the form
      if (editId === id) {
        resetForm();
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Animal deleted",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
}

// =========================
// Event Listeners
// =========================

// One unified submit handler (combines both of your originals)
animalForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const animalType = document.getElementById("animalType").value.trim();

  if (!animalType) {
    Swal.fire({
      icon: "error",
      title: "Missing Required Field",
      text: "Please enter the type of animal.",
    });
    return;
  }

  const isEditMode = editId !== null;

  Swal.fire({
    title: isEditMode ? "Update Animal?" : "Save Animal?",
    text: isEditMode
      ? "Do you want to save the changes to this animal?"
      : "Do you want to add this animal to your list?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: isEditMode ? "Yes, Update" : "Yes, Save",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      if (isEditMode) {
        updateAnimal(editId);
      } else {
        addAnimal();
      }

      // Hide the Bootstrap modal (if used)
      if (addAnimalModalElement && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getInstance(addAnimalModalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      }

      // Reset the form
      resetForm();

      // Success toast
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isEditMode
          ? "Animal updated successfully"
          : "Animal added successfully",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  });
});

// Table edit/delete buttons (event delegation)
animalsTableBody.addEventListener("click", function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  if (!id) return;

  if (btn.classList.contains("btn-edit")) {
    handleEdit(id);
  } else if (btn.classList.contains("btn-delete")) {
    handleDelete(id);
  }
});

// =========================
// "See Info" button from cards
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

  const detailsHtml = `
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
    <p><strong>Feeding Amount:</strong> ${animal.feedingAmount || "-"}</p>
    <p><strong>Feeding What:</strong> ${animal.feedingWhat || "-"}</p>
    <hr>
    <p><strong>Description:</strong> ${animal.description || "-"}</p>
    <p><strong>Notes:</strong> ${animal.notes || "-"}</p>
  `;

  Swal.fire({
    title: "Animal Details",
    html: detailsHtml,
    icon: "info",
    width: 600,
  });
}
