const animalForm = document.getElementById("animalForm");
const animalsTableBody = document.querySelector("#animalsTable tbody");
const submitBtn = animalForm.querySelector("button[type='submit']");
const animalGrid = document.getElementById("animalGrid");
const searchInput = document.getElementById("searchAnimals"); 
const animalPhotoInput = document.getElementById("animalPhoto"); 
const addAnimalModalElement = document.getElementById("addAnimalModal");
const birthdateUnknownCheckbox = document.getElementById("birthdateUnknown");

let animals = []; // animal database stores
let editId = null; // null is add mode
let currentSearch = ""; // search filter

function filterAnimals() {
  if (!currentSearch) return animals;
  const term = currentSearch.toLowerCase();
  return animals.filter((a) => 
      (a.name || "").toLowerCase().includes(term) ||
      (a.type || "").toLowerCase().includes(term) ||
      (a.breed || "").toLowerCase().includes(term)
  );
}

function collectFormData(extraFields = {}) {

  const isUnknown = document.getElementById("birthdateUnknown")?.checked || false;

  return {
    name: document.getElementById("animalName")?.value.trim() || "",
    type: document.getElementById("animalType").value.trim(),
    breed: document.getElementById("breed").value.trim(),
    sex: document.querySelector("input[name='sex']:checked")?.value || "",
    birthdate: document.getElementById("birthdate").value,
    birthdateUnknown: isUnknown, // added: send checkbox status
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
    ...extraFields,
  };
}

function resetForm() {
  // resets form back to adding animals
  animalForm.reset();
  editId = null;

  submitBtn.textContent = "Save Animal (Server)";
  submitBtn.classList.remove("btn-warning");
  submitBtn.classList.add("btn-success");

  // clears files
  if (animalPhotoInput) {
    animalPhotoInput.value = "";
  }

  // resets date input state
  if (birthdateUnknownCheckbox) {
      birthdateUnknownCheckbox.checked = false;
      document.getElementById("birthdate").disabled = false;
  }
}


// creates table
function makeTable() {
  if (!animalsTableBody) return;

  animalsTableBody.innerHTML = "";

  const list = filterAnimals();

  if (!list.length) {
    animalsTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No animals found.</td></tr>`;
    return;
  }

  list.forEach((a) => {
    let bdateDisplay = a.birthdate || "-";

    if (a.birthdateUnknown === true || a.birthdateUnknown === "true" || a.birthdateUnknown === 1) {
        bdateDisplay = "Unknown";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        ${
          a.photo
            ? `<img src="${a.photo}" alt="Photo of ${a.type || "animal"}" class="img-thumbnail" style="max-width: 80px; max-height: 80px; object-fit: cover;">`
            : "—"
        }
      </td>
      <td>${a.name || "-"}</td> <td>${a.type || "-"}</td>
      <td>${a.breed || "-"}</td>
      <td>${a.sex || "-"}</td>
      <td>${bdateDisplay}</td>
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

// makes the cards
function makeCards() {
  if (!animalGrid) return;

  animalGrid.innerHTML = "";

  const list = filterAnimals();

  list.forEach((a) => {
    const type = a.type || "Animal";
    const name = a.name || type; 
    const breed = a.breed || "";
    const sex = a.sex || "";
    const separator = sex && breed ? " | " : "";

    // calculate birthdate display for card
    let bdateDisplay = a.birthdate || "";
    if (a.birthdateUnknown === true || a.birthdateUnknown === "true" || a.birthdateUnknown === 1) {
        bdateDisplay = "Unknown";
    }

    const imageSrc =
      a.photo ||
      `https://placehold.co/300x250?text=${encodeURIComponent(type)}`;

    const cardHTML = `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card h-100 shadow-sm animal-card">
          <img src="${imageSrc}" class="card-img-top" alt="Picture of a ${type}">
          <div class="card-body">
            <h5 class="card-title">${name}</h5>
            <p class="card-text text-muted">${sex}${separator}${breed}</p>
            <p class="card-text small text-muted">Born: ${bdateDisplay}</p>
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

// render everything from the animals array
function makeUI() {
  makeTable();
  makeCards();
}

// gets all animals from animals.db
function fetchAnimals() {
    fetch('/animals')
        .then(response => response.json())
        .then(json => {
            if (json.message === "success") {
                animals = json.data;
                makeUI();
            } else {
                console.error("Error retrieving data:", json.error);
            }
        })
        .catch(err => console.error("Fetch error:", err));
}

// adds new animal
function addAnimal(animalData) {
  fetch('/animals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(animalData)
  })
  .then(response => response.json())
  .then(json => {
      if (json.message === "success") {
          fetchAnimals(); // refresh list from db
      } else {
          Swal.fire("Error", "Could not save animal: " + json.error, "error");
      }
  })
  .catch(err => Swal.fire("Error", "Network error: " + err, "error"));
}

// updates animal in database
function updateAnimal(id, animalData) {
  // combine id with data for the put request body
  const payload = { ...animalData, id: id };
  
  fetch('/animals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(json => {
      if (json.message === "success") {
          fetchAnimals(); // refresh list from db
      } else {
          Swal.fire("Error", "Could not update animal: " + json.error, "error");
      }
  })
  .catch(err => Swal.fire("Error", "Network error: " + err, "error"));
}

// removes animal from database
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
      
      fetch('/animals', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id })
      })
      .then(response => response.json())
      .then(json => {
          if (json.message === "deleted") {
             fetchAnimals(); // refresh
             
             // resets form
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
          } else {
              Swal.fire("Error", "Delete failed: " + json.error, "error");
          }
      })
      .catch(err => Swal.fire("Error", "Network error: " + err, "error"));
    }
  });
}

function handleEdit(id) {
  // edit button
  const animal = animals.find((a) => a.id === id);
  if (!animal) return;

  // grab animal data
  const nameInput = document.getElementById("animalName");
  if (nameInput) nameInput.value = animal.name || "";

  document.getElementById("animalType").value = animal.type;
  document.getElementById("breed").value = animal.breed;
  document.getElementById("birthdate").value = animal.birthdate;
  
  const chk = document.getElementById("birthdateUnknown");
  if (chk) {
      chk.checked = (animal.birthdateUnknown === true || animal.birthdateUnknown === "true" || animal.birthdateUnknown === 1);
      // disable input if checked
      const dateInput = document.getElementById("birthdate");
      if(dateInput) dateInput.disabled = chk.checked;
  }

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

  // gender check
  if (animal.sex === "Male") {
    document.getElementById("sexMale").checked = true;
  } else if (animal.sex === "Female") {
    document.getElementById("sexFemale").checked = true;
  }

  editId = id;

  submitBtn.textContent = "Update Animal";
  submitBtn.classList.remove("btn-success");
  submitBtn.classList.add("btn-warning");

  document.getElementById("animalType").focus();
}

// search bar
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value || "";
    makeUI();
  });
}

// toggles date input when unknown is checked
if (birthdateUnknownCheckbox) {
  birthdateUnknownCheckbox.addEventListener("change", function() {
    const dateInput = document.getElementById("birthdate");
    if (!dateInput) return;
    if (this.checked) {
      dateInput.value = "";
      dateInput.disabled = true;
    } else {
      dateInput.disabled = false;
    }
  });
}

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
    if (!result.isConfirmed) return;

    const file = animalPhotoInput?.files?.[0] || null;

    const existingAnimal = isEditMode
      ? animals.find((a) => a.id === editId)
      : null;
    const existingPhoto = existingAnimal?.photo || "";

    const finalizeSave = (photoDataUrl) => {
      const formData = collectFormData({ photo: photoDataUrl }); 
      if (isEditMode) {
        updateAnimal(editId, formData);
      } else {
        addAnimal(formData);
      }

      if (addAnimalModalElement && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getInstance(addAnimalModalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      }

      // resets form
      resetForm();

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
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        finalizeSave(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      finalizeSave(existingPhoto);
    }
  });
});

// edit/delete buttons
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

// shows animal details
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

  let bdateDisplay = animal.birthdate || "-";
  if (animal.birthdateUnknown === true || animal.birthdateUnknown === "true" || animal.birthdateUnknown === 1) {
      bdateDisplay = "Unknown";
  }

  const photoHtml = animal.photo
    ? `<div class="mb-3 text-center">
         <img src="${animal.photo}" alt="Photo of ${animal.type || "animal"}"
              style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 0.5rem;">
       </div>`
    : "";

  const detailsHtml = `
    ${photoHtml}
    <p><strong>Name:</strong> ${animal.name || "-"}</p>
    <p><strong>Type:</strong> ${animal.type || "-"}</p>
    <p><strong>Breed:</strong> ${animal.breed || "-"}</p>
    <p><strong>Sex:</strong> ${animal.sex || "-"}</p>
    <p><strong>Birthdate:</strong> ${bdateDisplay}</p>
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

// loads in saved animal data
fetchAnimals();