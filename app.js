const defaultExerciseOptions = [
  { name: "Chest Press", group: "Chest", defaults: [70, 80, 90] },
  { name: "Pec", group: "Chest", defaults: [70, 85, 100] },
  { name: "Triceps Push Down", group: "Triceps", defaults: [27, 36, 41] },
  { name: "Biceps", group: "Arms", defaults: [40, 55, 70] },
  { name: "Shoulder Press", group: "Shoulders", defaults: [30, 40, 40] },
  { name: "Lat Pull Down", group: "Back", defaults: [100, 115, 130] },
  { name: "Seated Row", group: "Back", defaults: [50, 60, 80] },
  { name: "Leg Press", group: "Legs", defaults: [180, 225, 270] },
  { name: "Leg Curl", group: "Legs", defaults: [65, 75, 85] },
  { name: "Leg Extension", group: "Legs", defaults: [65, 75, 85] },
  { name: "Abdominal", group: "Core", defaults: [85, 85, 85] }
];

const customExerciseStorageKey = "iphone-workout-exercises";
const sampleEntries = [
  {
    id: makeId(),
    date: todayString(),
    exercise: "Chest Press",
    group: "Chest",
    sets: [{ weight: 110, reps: 12 }, { weight: 120, reps: 10 }, { weight: 130, reps: 8 }],
    notes: "Strong top set",
    createdAt: new Date().toISOString()
  },
  {
    id: makeId(),
    date: todayString(),
    exercise: "Biceps",
    group: "Arms",
    sets: [{ weight: 40, reps: 12 }, { weight: 55, reps: 10 }, { weight: 70, reps: 8 }],
    notes: "Good pump",
    createdAt: new Date().toISOString()
  },
  {
    id: makeId(),
    date: "2026-04-07",
    exercise: "Leg Press",
    group: "Legs",
    sets: [{ weight: 180, reps: 12 }, { weight: 225, reps: 10 }, { weight: 270, reps: 8 }],
    notes: "Full range",
    createdAt: "2026-04-07T19:30:00.000Z"
  }
];

const storageKey = "iphone-workout-history";
let exerciseOptions = loadExercises();
let entries = loadEntries();
let selectedExercise = exerciseOptions[0].name;

const workoutDate = document.getElementById("workoutDate");
const exerciseSelect = document.getElementById("exerciseSelect");
const exerciseGrid = document.getElementById("exerciseGrid");
const muscleGroup = document.getElementById("muscleGroup");
const lastTime = document.getElementById("lastTime");
const setGrid = document.getElementById("setGrid");
const notes = document.getElementById("notes");
const notice = document.getElementById("notice");
const sessionList = document.getElementById("sessionList");
const progressList = document.getElementById("progressList");
const historyList = document.getElementById("historyList");
const addExerciseCard = document.getElementById("addExerciseCard");
const deleteExerciseCard = document.getElementById("deleteExerciseCard");
const lastWorkoutDate = document.getElementById("lastWorkoutDate");
const lastWorkoutSets = document.getElementById("lastWorkoutSets");
const newExerciseName = document.getElementById("newExerciseName");
const newExerciseGroup = document.getElementById("newExerciseGroup");
const newDefault1 = document.getElementById("newDefault1");
const newDefault2 = document.getElementById("newDefault2");
const newDefault3 = document.getElementById("newDefault3");
const deleteExerciseSelect = document.getElementById("deleteExerciseSelect");
const deleteExerciseHelp = document.getElementById("deleteExerciseHelp");

workoutDate.value = todayString();
document.getElementById("todayLabel").textContent = readableDate(todayString());

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function readableDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function filenameDate(value) {
  return (value || todayString()).replaceAll("-", "-");
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function loadExercises() {
  try {
    const saved = JSON.parse(localStorage.getItem(customExerciseStorageKey)) || [];
    return [...defaultExerciseOptions, ...saved];
  } catch {
    return [...defaultExerciseOptions];
  }
}

function saveEntries() {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function saveCustomExercises() {
  const customExercises = exerciseOptions.filter((exercise) => {
    return !defaultExerciseOptions.some((base) => base.name === exercise.name);
  });
  localStorage.setItem(customExerciseStorageKey, JSON.stringify(customExercises));
}

function isDefaultExercise(name) {
  return defaultExerciseOptions.some((exercise) => exercise.name === name);
}

function customExercises() {
  return exerciseOptions.filter((exercise) => !isDefaultExercise(exercise.name));
}

function flash(message, isError = false) {
  notice.textContent = message;
  notice.style.color = isError ? "var(--warn)" : "var(--ok)";
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => {
    notice.textContent = "";
  }, 2400);
}

function buildExercisePicker() {
  exerciseSelect.innerHTML = "";
  exerciseGrid.innerHTML = "";

  exerciseOptions.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise.name;
    option.textContent = exercise.name;
    exerciseSelect.appendChild(option);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "exercise-card";
    button.dataset.exercise = exercise.name;
    button.innerHTML = `<strong>${exercise.name}</strong><span>${exercise.group}</span>`;
    button.addEventListener("click", () => {
      selectedExercise = exercise.name;
      exerciseSelect.value = exercise.name;
      syncExercise();
    });
    exerciseGrid.appendChild(button);
  });
}

function buildSetGrid() {
  setGrid.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    const row = document.createElement("div");
    row.className = "set-row";
    row.innerHTML = `
      <strong>Set ${i + 1}</strong>
      <input type="number" inputmode="numeric" min="0" step="1" data-kind="weight" data-index="${i}" placeholder="Weight">
      <input type="number" inputmode="numeric" min="0" step="1" data-kind="reps" data-index="${i}" placeholder="Reps">
    `;
    setGrid.appendChild(row);
  }
}

function getExercise(name) {
  return exerciseOptions.find((exercise) => exercise.name === name);
}

function latestEntryFor(exerciseName) {
  return [...entries]
    .filter((entry) => entry.exercise === exerciseName)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

function syncExercise() {
  selectedExercise = exerciseSelect.value;
  const exercise = getExercise(selectedExercise);
  muscleGroup.value = exercise.group;

  document.querySelectorAll(".exercise-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.exercise === selectedExercise);
  });

  const recent = latestEntryFor(selectedExercise);
  lastTime.value = recent
    ? `${recent.date} • ${recent.sets.map((set) => set.weight || "-").join("/")}`
    : "No history yet";

  if (recent) {
    lastWorkoutDate.textContent = readableDate(recent.date);
    lastWorkoutSets.textContent = recent.sets
      .map((set, index) => `Set ${index + 1}: ${set.weight || "-"} x ${set.reps || "-"}`)
      .join(" • ");
  } else {
    lastWorkoutDate.textContent = "No history yet";
    lastWorkoutSets.textContent = "Choose an exercise to see the previous sets.";
  }

  document.querySelectorAll('[data-kind="weight"]').forEach((input, index) => {
    if (!input.dataset.touched) {
      input.value = recent ? (recent.sets[index]?.weight ?? "") : (exercise.defaults[index] ?? "");
    }
  });
  document.querySelectorAll('[data-kind="reps"]').forEach((input) => {
    const index = Number(input.dataset.index);
    if (!input.dataset.touched) {
      input.value = recent ? (recent.sets[index]?.reps ?? "") : 10;
    }
  });
}

function collectSets() {
  const weights = [...document.querySelectorAll('[data-kind="weight"]')];
  const reps = [...document.querySelectorAll('[data-kind="reps"]')];
  return weights.map((weightInput, index) => ({
    weight: Number(weightInput.value) || 0,
    reps: Number(reps[index].value) || 0
  }));
}

function resetForm() {
  document.querySelectorAll('[data-kind="weight"]').forEach((input) => {
    input.dataset.touched = "";
  });
  document.querySelectorAll('[data-kind="reps"]').forEach((input) => {
    input.dataset.touched = "";
    input.value = "";
  });
  notes.value = "";
  syncExercise();
}

function sumVolume(list) {
  return list.reduce((total, entry) => {
    return total + entry.sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0);
  }, 0);
}

function renderStats() {
  const currentDate = workoutDate.value || todayString();
  const todaysEntries = entries.filter((entry) => entry.date === currentDate);
  document.getElementById("todayEntries").textContent = todaysEntries.length;
  document.getElementById("todayExercises").textContent = new Set(todaysEntries.map((entry) => entry.exercise)).size;
  document.getElementById("todayVolume").textContent = sumVolume(todaysEntries).toLocaleString();
  document.getElementById("sessionDate").textContent = readableDate(currentDate);
}

function renderSession() {
  const currentDate = workoutDate.value || todayString();
  const todaysEntries = [...entries]
    .filter((entry) => entry.date === currentDate)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sessionList.innerHTML = "";
  if (!todaysEntries.length) {
    sessionList.innerHTML = `<div class="empty">No entries for this day yet. Save your first exercise above.</div>`;
    return;
  }

  todaysEntries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="item-head">
        <strong>${entry.exercise}</strong>
        <span class="muted">${entry.group}</span>
      </div>
      <div>${entry.sets.map((set, index) => `Set ${index + 1}: ${set.weight || "-"} x ${set.reps || "-"}`).join(" • ")}</div>
      <div class="muted" style="margin-top: 6px;">${entry.notes || "No notes"}</div>
    `;
    sessionList.appendChild(item);
  });
}

function renderProgress() {
  progressList.innerHTML = "";
  exerciseOptions.forEach((exercise) => {
    const latest = latestEntryFor(exercise.name);
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = latest
      ? `
        <div class="item-head">
          <strong>${exercise.name}</strong>
          <span class="muted">${latest.date}</span>
        </div>
        <div class="muted">${exercise.group}</div>
        <div style="margin-top: 6px;">${latest.sets.map((set, index) => `Set ${index + 1}: ${set.weight || "-"} x ${set.reps || "-"}`).join(" • ")}</div>
      `
      : `
        <div class="item-head">
          <strong>${exercise.name}</strong>
          <span class="muted">No history</span>
        </div>
        <div class="muted">${exercise.group}</div>
      `;
    progressList.appendChild(card);
  });
}

function renderHistory() {
  const ordered = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  historyList.innerHTML = "";
  if (!ordered.length) {
    historyList.innerHTML = `<div class="empty">Your saved workout history will show up here.</div>`;
    return;
  }

  ordered.slice(0, 20).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="item-head">
        <strong>${entry.exercise}</strong>
        <span class="muted">${readableDate(entry.date)}</span>
      </div>
      <div class="muted">${entry.group}</div>
      <div style="margin-top: 6px;">${entry.sets.map((set, index) => `S${index + 1}: ${set.weight || "-"} x ${set.reps || "-"}`).join(" • ")}</div>
      <div class="muted" style="margin-top: 6px;">${entry.notes || "No notes"}</div>
    `;
    historyList.appendChild(item);
  });
}

function renderAll() {
  renderStats();
  renderSession();
  renderProgress();
  renderHistory();
  buildDeleteExercisePicker();
  syncExercise();
}

function resetAddExerciseForm() {
  newExerciseName.value = "";
  newExerciseGroup.value = "";
  newDefault1.value = "";
  newDefault2.value = "";
  newDefault3.value = "";
}

function toggleAddExercise(show) {
  addExerciseCard.style.display = show ? "block" : "none";
  if (show) {
    deleteExerciseCard.style.display = "none";
  }
  if (show) {
    newExerciseName.focus();
  } else {
    resetAddExerciseForm();
  }
}

function buildDeleteExercisePicker() {
  const custom = customExercises();
  deleteExerciseSelect.innerHTML = "";

  if (!custom.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No custom exercises yet";
    deleteExerciseSelect.appendChild(option);
    deleteExerciseHelp.textContent = "Only exercises you added yourself can be deleted.";
    return;
  }

  custom.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise.name;
    option.textContent = exercise.name;
    deleteExerciseSelect.appendChild(option);
  });

  updateDeleteExerciseHelp();
}

function updateDeleteExerciseHelp() {
  const name = deleteExerciseSelect.value;
  if (!name) {
    deleteExerciseHelp.textContent = "Only exercises you added yourself can be deleted.";
    return;
  }
  const historyCount = entries.filter((entry) => entry.exercise === name).length;
  deleteExerciseHelp.textContent = historyCount
    ? `${historyCount} saved workout entr${historyCount === 1 ? "y" : "ies"} use this exercise. Deleting it removes it from the picker, not from history.`
    : "This exercise has no saved history yet.";
}

function toggleDeleteExercise(show) {
  deleteExerciseCard.style.display = show ? "block" : "none";
  if (show) {
    addExerciseCard.style.display = "none";
    buildDeleteExercisePicker();
  }
}

document.getElementById("saveEntry").addEventListener("click", () => {
  const exercise = getExercise(exerciseSelect.value);
  const sets = collectSets();
  const hasData = sets.some((set) => set.weight || set.reps) || notes.value.trim();
  if (!hasData) {
    flash("Enter at least one set or note first.", true);
    return;
  }

  const entry = {
    id: makeId(),
    date: workoutDate.value || todayString(),
    exercise: exercise.name,
    group: exercise.group,
    sets,
    notes: notes.value.trim(),
    createdAt: new Date().toISOString()
  };

  entries.unshift(entry);
  saveEntries();
  renderAll();
  resetForm();
  flash(`${exercise.name} saved.`);
});

document.getElementById("clearForm").addEventListener("click", () => {
  resetForm();
  flash("Form cleared.");
});

document.getElementById("showAddExercise").addEventListener("click", () => {
  toggleAddExercise(true);
});

document.getElementById("cancelAddExercise").addEventListener("click", () => {
  toggleAddExercise(false);
});

document.getElementById("showDeleteExercise").addEventListener("click", () => {
  toggleDeleteExercise(true);
});

document.getElementById("cancelDeleteExercise").addEventListener("click", () => {
  toggleDeleteExercise(false);
});

document.getElementById("saveExerciseType").addEventListener("click", () => {
  const name = newExerciseName.value.trim();
  const group = newExerciseGroup.value.trim();
  if (!name || !group) {
    flash("Enter an exercise name and muscle group.", true);
    return;
  }

  const exists = exerciseOptions.some((exercise) => exercise.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    flash("That exercise already exists.", true);
    return;
  }

  const newExercise = {
    name,
    group,
    defaults: [
      Number(newDefault1.value) || 0,
      Number(newDefault2.value) || 0,
      Number(newDefault3.value) || 0
    ]
  };

  exerciseOptions = [...exerciseOptions, newExercise].sort((a, b) => a.name.localeCompare(b.name));
  saveCustomExercises();
  buildExercisePicker();
  exerciseSelect.value = newExercise.name;
  selectedExercise = newExercise.name;
  toggleAddExercise(false);
  syncExercise();
  flash(`${name} added.`);
});

deleteExerciseSelect.addEventListener("change", updateDeleteExerciseHelp);

document.getElementById("confirmDeleteExercise").addEventListener("click", () => {
  const name = deleteExerciseSelect.value;
  if (!name) {
    flash("No custom exercise selected.", true);
    return;
  }

  const confirmDelete = window.confirm(`Delete ${name} from the exercise list?`);
  if (!confirmDelete) return;

  exerciseOptions = exerciseOptions.filter((exercise) => exercise.name !== name);
  saveCustomExercises();
  buildExercisePicker();

  if (selectedExercise === name) {
    selectedExercise = exerciseOptions[0].name;
    exerciseSelect.value = selectedExercise;
  }

  toggleDeleteExercise(false);
  renderAll();
  flash(`${name} deleted from the exercise list.`);
});

document.getElementById("loadDemo").addEventListener("click", () => {
  entries = [...sampleEntries, ...entries];
  saveEntries();
  renderAll();
  flash("Demo data loaded.");
});

document.getElementById("exportCsv").addEventListener("click", () => {
  if (!entries.length) {
    flash("No workout history to export yet.", true);
    return;
  }

  const headers = [
    "Date",
    "Exercise",
    "Muscle Group",
    "Set 1 Weight",
    "Set 1 Reps",
    "Set 2 Weight",
    "Set 2 Reps",
    "Set 3 Weight",
    "Set 3 Reps",
    "Notes",
    "Created At"
  ];

  const rows = entries
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((entry) => [
      entry.date,
      entry.exercise,
      entry.group,
      entry.sets[0]?.weight ?? "",
      entry.sets[0]?.reps ?? "",
      entry.sets[1]?.weight ?? "",
      entry.sets[1]?.reps ?? "",
      entry.sets[2]?.weight ?? "",
      entry.sets[2]?.reps ?? "",
      entry.notes || "",
      entry.createdAt || ""
    ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const orderedDates = entries
    .map((entry) => entry.date)
    .filter(Boolean)
    .sort();
  const startDate = orderedDates[0] || todayString();
  const endDate = orderedDates[orderedDates.length - 1] || todayString();

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `workout-history-${filenameDate(startDate)}-to-${filenameDate(endDate)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  flash("Excel-friendly CSV exported.");
});

document.getElementById("exportData").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "workout-history-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
  flash("Backup exported.");
});

document.getElementById("clearHistory").addEventListener("click", () => {
  if (!window.confirm("Clear all saved workout history on this device?")) return;
  entries = [];
  saveEntries();
  renderAll();
  flash("History cleared.");
});

workoutDate.addEventListener("change", renderAll);
exerciseSelect.addEventListener("change", syncExercise);

document.addEventListener("input", (event) => {
  if (event.target.matches('[data-kind="weight"]')) {
    event.target.dataset.touched = "true";
  }
  if (event.target.matches('[data-kind="reps"]')) {
    event.target.dataset.touched = "true";
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

buildExercisePicker();
buildSetGrid();
syncExercise();
renderAll();
