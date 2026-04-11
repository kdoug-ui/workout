import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const storageKeys = {
  entries: "iphone-workout-history",
  exercises: "iphone-workout-exercises",
  cloud: "iphone-workout-cloud-config"
};

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
  }
];

let entries = loadEntries();
let exerciseOptions = loadExercises();
let selectedExercise = exerciseOptions[0]?.name ?? "";
let supabase = null;
let currentUser = null;
let cloudConfig = loadCloudConfig();

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
const supabaseUrlInput = document.getElementById("supabaseUrl");
const supabaseAnonKeyInput = document.getElementById("supabaseAnonKey");
const emailInput = document.getElementById("emailInput");
const syncStatus = document.getElementById("syncStatus");
const syncModeLabel = document.getElementById("syncModeLabel");

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

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.entries)) || [];
  } catch {
    return [];
  }
}

function loadExercises() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.exercises)) || [];
    return [...defaultExerciseOptions, ...saved];
  } catch {
    return [...defaultExerciseOptions];
  }
}

function loadCloudConfig() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.cloud)) || { url: "", anonKey: "", email: "" };
  } catch {
    return { url: "", anonKey: "", email: "" };
  }
}

function saveEntries() {
  localStorage.setItem(storageKeys.entries, JSON.stringify(entries));
}

function saveCustomExercises() {
  const custom = exerciseOptions.filter((exercise) => !isDefaultExercise(exercise.name));
  localStorage.setItem(storageKeys.exercises, JSON.stringify(custom));
}

function saveCloudConfig() {
  localStorage.setItem(storageKeys.cloud, JSON.stringify(cloudConfig));
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
  }, 2600);
}

function updateSyncUi(message = "") {
  supabaseUrlInput.value = cloudConfig.url || "";
  supabaseAnonKeyInput.value = cloudConfig.anonKey || "";
  emailInput.value = cloudConfig.email || "";

  if (!cloudConfig.url || !cloudConfig.anonKey) {
    syncModeLabel.textContent = "local only";
    syncStatus.textContent = message || "Cloud sync not configured yet.";
    return;
  }

  if (!currentUser) {
    syncModeLabel.textContent = "cloud ready";
    syncStatus.textContent = message || "Cloud configured. Email yourself a sign-in link to sync across devices.";
    return;
  }

  syncModeLabel.textContent = "cloud connected";
  syncStatus.textContent = message || `Signed in as ${currentUser.email}. Sync is active across devices.`;
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
  if (!exerciseSelect.value && exerciseOptions[0]) {
    exerciseSelect.value = exerciseOptions[0].name;
  }

  selectedExercise = exerciseSelect.value;
  const exercise = getExercise(selectedExercise);
  if (!exercise) return;

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
  return list.reduce((total, entry) => total + entry.sets.reduce((inner, set) => inner + (set.weight * set.reps), 0), 0);
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
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = latest
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
    progressList.appendChild(item);
  });
}

function renderHistory() {
  const ordered = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  historyList.innerHTML = "";
  if (!ordered.length) {
    historyList.innerHTML = `<div class="empty">Your saved workout history will show up here.</div>`;
    return;
  }

  ordered.slice(0, 30).forEach((entry) => {
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
    deleteExerciseHelp.textContent = "Only exercises you add yourself can be deleted.";
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
    deleteExerciseHelp.textContent = "Only exercises you add yourself can be deleted.";
    return;
  }
  const historyCount = entries.filter((entry) => entry.exercise === name).length;
  deleteExerciseHelp.textContent = historyCount
    ? `${historyCount} saved entr${historyCount === 1 ? "y" : "ies"} use this exercise. Deleting it removes it from the picker, not from history.`
    : "This exercise has no saved history yet.";
}

function toggleDeleteExercise(show) {
  deleteExerciseCard.style.display = show ? "block" : "none";
  if (show) {
    addExerciseCard.style.display = "none";
    buildDeleteExercisePicker();
  }
}

function exportCsv() {
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

  const orderedDates = entries.map((entry) => entry.date).filter(Boolean).sort();
  const startDate = orderedDates[0] || todayString();
  const endDate = orderedDates[orderedDates.length - 1] || todayString();
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `workout-history-${startDate}-to-${endDate}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  flash("Excel-friendly CSV exported.");
}

function entryToRow(entry) {
  return {
    id: entry.id,
    user_id: currentUser.id,
    workout_date: entry.date,
    exercise_name: entry.exercise,
    muscle_group: entry.group,
    set1_weight: entry.sets[0]?.weight ?? 0,
    set1_reps: entry.sets[0]?.reps ?? 0,
    set2_weight: entry.sets[1]?.weight ?? 0,
    set2_reps: entry.sets[1]?.reps ?? 0,
    set3_weight: entry.sets[2]?.weight ?? 0,
    set3_reps: entry.sets[2]?.reps ?? 0,
    notes: entry.notes || "",
    created_at: entry.createdAt
  };
}

function rowToEntry(row) {
  return {
    id: row.id,
    date: row.workout_date,
    exercise: row.exercise_name,
    group: row.muscle_group,
    sets: [
      { weight: row.set1_weight || 0, reps: row.set1_reps || 0 },
      { weight: row.set2_weight || 0, reps: row.set2_reps || 0 },
      { weight: row.set3_weight || 0, reps: row.set3_reps || 0 }
    ],
    notes: row.notes || "",
    createdAt: row.created_at
  };
}

function exerciseToRow(exercise) {
  return {
    user_id: currentUser.id,
    name: exercise.name,
    muscle_group: exercise.group,
    default1: exercise.defaults[0] || 0,
    default2: exercise.defaults[1] || 0,
    default3: exercise.defaults[2] || 0
  };
}

function rowToExercise(row) {
  return {
    name: row.name,
    group: row.muscle_group,
    defaults: [row.default1 || 0, row.default2 || 0, row.default3 || 0]
  };
}

function applyCloudExercises(remoteExercises) {
  const merged = [...defaultExerciseOptions];
  remoteExercises.forEach((exercise) => {
    if (!merged.some((item) => item.name === exercise.name)) {
      merged.push(exercise);
    }
  });
  exerciseOptions = merged.sort((a, b) => a.name.localeCompare(b.name));
  saveCustomExercises();
}

async function initializeSupabase() {
  if (!cloudConfig.url || !cloudConfig.anonKey) {
    supabase = null;
    currentUser = null;
    updateSyncUi();
    return;
  }

  supabase = createClient(cloudConfig.url, cloudConfig.anonKey);
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    updateSyncUi("Cloud configured, but session lookup failed.");
    return;
  }

  currentUser = data.session?.user ?? null;
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateSyncUi();
    if (currentUser) {
      syncFromCloud().catch(() => {});
    }
  });

  updateSyncUi();
}

async function sendMagicLink() {
  if (!supabase) {
    flash("Save your Supabase URL and anon key first.", true);
    return;
  }

  const email = emailInput.value.trim();
  if (!email) {
    flash("Enter your email first.", true);
    return;
  }

  cloudConfig.email = email;
  saveCloudConfig();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href }
  });

  if (error) {
    flash(error.message, true);
    updateSyncUi("Magic link request failed.");
    return;
  }

  updateSyncUi(`Magic link sent to ${email}. Open it on each device you want synced.`);
  flash("Magic link sent.");
}

async function syncFromCloud() {
  if (!supabase || !currentUser) {
    updateSyncUi();
    return;
  }

  updateSyncUi("Syncing from cloud...");

  const [{ data: remoteEntries, error: entriesError }, { data: remoteExercises, error: exercisesError }] = await Promise.all([
    supabase.from("workout_entries").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
    supabase.from("exercise_types").select("*").eq("user_id", currentUser.id).order("name")
  ]);

  if (entriesError || exercisesError) {
    flash(entriesError?.message || exercisesError?.message || "Cloud sync failed.", true);
    updateSyncUi("Cloud sync failed. Check your tables and sign-in.");
    return;
  }

  entries = remoteEntries.map(rowToEntry);
  applyCloudExercises(remoteExercises.map(rowToExercise));
  saveEntries();
  renderAll();
  updateSyncUi(`Synced ${entries.length} workout entries from cloud.`);
}

async function saveEntryToCloud(entry) {
  if (!supabase || !currentUser) return;
  const { error } = await supabase.from("workout_entries").upsert(entryToRow(entry));
  if (error) {
    flash(`Saved locally, but cloud sync failed: ${error.message}`, true);
    updateSyncUi("Cloud save failed.");
  } else {
    updateSyncUi("Entry saved to cloud.");
  }
}

async function saveExerciseToCloud(exercise) {
  if (!supabase || !currentUser) return;
  const { error } = await supabase.from("exercise_types").upsert(exerciseToRow(exercise), { onConflict: "user_id,name" });
  if (error) {
    flash(`Exercise saved locally, but cloud sync failed: ${error.message}`, true);
    updateSyncUi("Cloud save failed.");
  } else {
    updateSyncUi("Exercise saved to cloud.");
  }
}

async function deleteExerciseFromCloud(name) {
  if (!supabase || !currentUser) return;
  const { error } = await supabase.from("exercise_types").delete().eq("user_id", currentUser.id).eq("name", name);
  if (error) {
    flash(`Cloud delete failed: ${error.message}`, true);
    updateSyncUi("Cloud delete failed.");
  } else {
    updateSyncUi("Exercise removed from cloud.");
  }
}

async function saveCloudSettings() {
  cloudConfig = {
    url: supabaseUrlInput.value.trim(),
    anonKey: supabaseAnonKeyInput.value.trim(),
    email: emailInput.value.trim()
  };
  saveCloudConfig();
  await initializeSupabase();
  flash("Cloud settings saved.");
}

function clearCloudSettings() {
  cloudConfig = { url: "", anonKey: "", email: "" };
  saveCloudConfig();
  supabase = null;
  currentUser = null;
  updateSyncUi("Using local-only mode.");
  flash("Cloud sync disabled on this device.");
}

document.getElementById("saveEntry").addEventListener("click", async () => {
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
  await saveEntryToCloud(entry);
});

document.getElementById("clearForm").addEventListener("click", () => {
  resetForm();
  flash("Form cleared.");
});

document.getElementById("showAddExercise").addEventListener("click", () => toggleAddExercise(true));
document.getElementById("cancelAddExercise").addEventListener("click", () => toggleAddExercise(false));
document.getElementById("showDeleteExercise").addEventListener("click", () => toggleDeleteExercise(true));
document.getElementById("cancelDeleteExercise").addEventListener("click", () => toggleDeleteExercise(false));

document.getElementById("saveExerciseType").addEventListener("click", async () => {
  const name = newExerciseName.value.trim();
  const group = newExerciseGroup.value.trim();
  if (!name || !group) {
    flash("Enter an exercise name and muscle group.", true);
    return;
  }

  if (exerciseOptions.some((exercise) => exercise.name.toLowerCase() === name.toLowerCase())) {
    flash("That exercise already exists.", true);
    return;
  }

  const exercise = {
    name,
    group,
    defaults: [
      Number(newDefault1.value) || 0,
      Number(newDefault2.value) || 0,
      Number(newDefault3.value) || 0
    ]
  };

  exerciseOptions = [...exerciseOptions, exercise].sort((a, b) => a.name.localeCompare(b.name));
  saveCustomExercises();
  buildExercisePicker();
  exerciseSelect.value = exercise.name;
  selectedExercise = exercise.name;
  toggleAddExercise(false);
  syncExercise();
  flash(`${name} added.`);
  await saveExerciseToCloud(exercise);
});

deleteExerciseSelect.addEventListener("change", updateDeleteExerciseHelp);

document.getElementById("confirmDeleteExercise").addEventListener("click", async () => {
  const name = deleteExerciseSelect.value;
  if (!name) {
    flash("No custom exercise selected.", true);
    return;
  }

  if (!window.confirm(`Delete ${name} from the exercise list?`)) return;

  exerciseOptions = exerciseOptions.filter((exercise) => exercise.name !== name);
  saveCustomExercises();
  buildExercisePicker();
  if (selectedExercise === name) {
    selectedExercise = exerciseOptions[0]?.name ?? "";
    exerciseSelect.value = selectedExercise;
  }
  toggleDeleteExercise(false);
  renderAll();
  flash(`${name} deleted from the exercise list.`);
  await deleteExerciseFromCloud(name);
});

document.getElementById("loadDemo").addEventListener("click", () => {
  entries = [...sampleEntries, ...entries];
  saveEntries();
  renderAll();
  flash("Demo data loaded.");
});

document.getElementById("exportCsv").addEventListener("click", exportCsv);

document.getElementById("exportData").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "workout-history-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
  flash("Backup exported.");
});

document.getElementById("clearHistory").addEventListener("click", async () => {
  if (!window.confirm("Clear all saved workout history on this device?")) return;
  entries = [];
  saveEntries();
  renderAll();
  flash("Local history cleared.");
  if (supabase && currentUser) {
    const { error } = await supabase.from("workout_entries").delete().eq("user_id", currentUser.id);
    if (error) {
      flash(`Local clear worked, but cloud clear failed: ${error.message}`, true);
    } else {
      updateSyncUi("Local and cloud history cleared.");
    }
  }
});

document.getElementById("saveCloudConfig").addEventListener("click", async () => {
  await saveCloudSettings();
});

document.getElementById("sendMagicLink").addEventListener("click", async () => {
  await sendMagicLink();
});

document.getElementById("syncNow").addEventListener("click", async () => {
  await syncFromCloud();
  flash("Sync complete.");
});

document.getElementById("useLocalOnly").addEventListener("click", () => {
  clearCloudSettings();
});

workoutDate.addEventListener("change", renderAll);
exerciseSelect.addEventListener("change", syncExercise);

document.addEventListener("input", (event) => {
  if (event.target.matches('[data-kind="weight"], [data-kind="reps"]')) {
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
updateSyncUi();
await initializeSupabase();
syncExercise();
renderAll();
