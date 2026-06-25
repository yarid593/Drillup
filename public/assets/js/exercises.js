const exercisesData = window.DRILLUP_EXERCISES;
const categories = exercisesData.categories;

const exerciseGrid = document.querySelector("#exerciseGrid");
const routineGrid = document.querySelector("#routineGrid");
const categoryTitle = document.querySelector("#categoryTitle");
const categoryDescription = document.querySelector("#categoryDescription");
const firstRoutineButton = document.querySelector("#firstRoutineButton");
const backToHome = document.querySelector("#backToHome");
const backToCategory = document.querySelector("#backToCategory");
const detailCategory = document.querySelector("#detailCategory");
const detailAnimation = document.querySelector("#detailAnimation");
const detailTitle = document.querySelector("#detailTitle");
const detailDescription = document.querySelector("#detailDescription");
const detailLevel = document.querySelector("#detailLevel");
const detailTime = document.querySelector("#detailTime");
const helpText = document.querySelector("#helpText");
const timerButton = document.querySelector("#timerButton");
const timerDisplay = document.querySelector("#timerDisplay");
const previousExercise = document.querySelector("#previousExercise");
const nextExercise = document.querySelector("#nextExercise");
const progressLabel = document.querySelector("#progressLabel");
const progressFill = document.querySelector("#progressFill");

let currentCategoryKey = "dribbling";
let currentExerciseIndex = 0;
let timerInterval = null;
let timerSeconds = 0;
let activeTimerSeconds = 0;
let repetitionGoal = 0;
let currentRepetitions = 0;
let activeRoutine = null;

function exerciseId(categoryKey = currentCategoryKey, index = currentExerciseIndex) {
  return `${categoryKey}:${index}`;
}

function getTotalExercises() {
  return Object.values(categories).reduce((total, category) => total + category.exercises.length, 0);
}

function getCompletedExercises() {
  return readJson(userKey(COMPLETED_EXERCISES_BASE), []);
}

function syncExerciseProgress() {
  if (!userKey(COMPLETED_EXERCISES_BASE)) return;
  const completed = getCompletedExercises();
  const progress = Math.round((completed.length / getTotalExercises()) * 100);

  exercisesData.progress = progress;
  progressLabel.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;

  if (window.DrillUp && typeof DrillUp.refreshUserStats === "function") {
    DrillUp.refreshUserStats();
  }
}

function logActivity(type, label, minutes = 0) {
  const activity = readJson(userKey(ACTIVITY_BASE), {});
  const key = todayKey();
  const day = activity[key] || { date: key, views: 0, completions: 0, minutes: 0, items: [] };

  if (type === "view") day.views += 1;
  if (type === "complete") day.completions += 1;
  day.items.unshift({ type, label, minutes, at: new Date().toISOString() });
  day.items = day.items.slice(0, 8);
  activity[key] = day;
  writeJson(userKey(ACTIVITY_BASE), activity);

  if (window.DrillUp && typeof DrillUp.refreshUserStats === "function") {
    DrillUp.refreshUserStats();
  }
}

function markExerciseCompleted() {
  const id = exerciseId();
  const completed = getCompletedExercises();
  const category = categories[currentCategoryKey];
  const exercise = category.exercises[currentExerciseIndex];
  const minutes = Math.max(1, Math.ceil((timerSeconds || 60) / 60));

  const isNew = !completed.includes(id);
  if (isNew) {
    completed.push(id);
    writeJson(userKey(COMPLETED_EXERCISES_BASE), completed);
    syncExerciseProgress();
  }

  logActivity("complete", `${category.title}: ${exercise.name}`, minutes);

  if (window.DrillUp && typeof DrillUp.showNotification === "function") {
    if (isNew && activeRoutine && activeRoutine.categoryKey === currentCategoryKey && allCategoryExercisesCompleted(currentCategoryKey)) {
      completeRoutine(activeRoutine.categoryKey);
    } else {
      DrillUp.showNotification("✅", "Ejercicio completado", "Ejercicio completado correctamente.", "success");
    }
  }
}

function startRoutine() {
  if (allCategoryExercisesCompleted(currentCategoryKey)) return;
  activeRoutine = {
    categoryKey: currentCategoryKey,
    startedAt: new Date().toISOString()
  };
}

function cancelRoutine() {
  activeRoutine = null;
}

function allCategoryExercisesCompleted(categoryKey) {
  const category = categories[categoryKey];
  if (!category) return false;
  const completed = getCompletedExercises();
  return category.exercises.every((_, i) => completed.includes(`${categoryKey}:${i}`));
}

function completeRoutine(categoryKey) {
  activeRoutine = null;
  const category = categories[categoryKey];
  const completedRoutines = readJson(userKey(COMPLETED_ROUTINES_BASE), []);
  completedRoutines.push({
    categoryKey,
    categoryTitle: category.title,
    completedAt: new Date().toISOString(),
    exerciseCount: category.exercises.length
  });
  writeJson(userKey(COMPLETED_ROUTINES_BASE), completedRoutines);

  syncExerciseProgress();
  if (window.DrillUp && typeof DrillUp.showNotification === "function") {
    DrillUp.showNotification("🎉", "Rutina completada", `Has completado la rutina de ${category.title}.`, "celebration");
  }
  if (window.DrillUp && typeof DrillUp.refreshUserStats === "function") {
    DrillUp.refreshUserStats();
  }
}

function parseDuration(text) {
  const normalized = text.toLowerCase();
  const number = Number.parseInt(normalized, 10);

  if (Number.isNaN(number)) {
    return 0;
  }

  if (normalized.includes("minuto")) {
    return number * 60;
  }

  if (normalized.includes("segundo")) {
    return number;
  }

  return 0;
}

function parseRepetitions(text) {
  const normalized = text.toLowerCase();
  const number = Number.parseInt(normalized, 10);

  const isRepetitionGoal = normalized.includes("repeticiones")
    || normalized.includes("lanzamientos")
    || normalized.includes("por lado");

  if (Number.isNaN(number) || !isRepetitionGoal) {
    return 0;
  }

  return number;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function playBell() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const now = audioContext.currentTime;

  [880, 1174, 1568].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
    gain.gain.setValueAtTime(0.001, now + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.32, now + index * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.55);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + index * 0.12 + 0.6);
  });
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function setupTimer(timeText) {
  stopTimer();
  timerSeconds = parseDuration(timeText);
  repetitionGoal = parseRepetitions(timeText);
  currentRepetitions = 0;
  activeTimerSeconds = timerSeconds;
  timerButton.disabled = false;
  timerButton.closest(".timer-control").classList.toggle("repetition-mode", !timerSeconds && !!repetitionGoal);

  if (timerSeconds) {
    timerDisplay.textContent = formatTime(timerSeconds);
    timerButton.textContent = "Iniciar";
    return;
  }

  if (repetitionGoal) {
    timerDisplay.textContent = `0/${repetitionGoal}`;
    timerButton.textContent = "Contar";
    return;
  }

  timerDisplay.textContent = "--";
  timerButton.textContent = "Sin temporizador";
  timerButton.disabled = true;
}

function startTimer() {
  if (repetitionGoal && !timerSeconds) {
    if (currentRepetitions < 0) {
      currentRepetitions = 0;
      timerDisplay.textContent = `0/${repetitionGoal}`;
      timerButton.textContent = "Contar";
      return;
    }

    currentRepetitions += 1;
    timerDisplay.textContent = `${Math.min(currentRepetitions, repetitionGoal)}/${repetitionGoal}`;

    if (currentRepetitions >= repetitionGoal) {
      timerButton.textContent = "Reiniciar";
      playBell();
      markExerciseCompleted();
      currentRepetitions = -1;
    }

    return;
  }

  if (!timerSeconds) {
    return;
  }

  if (timerInterval) {
    stopTimer();
    timerButton.textContent = "Reanudar";
    return;
  }

  if (activeTimerSeconds <= 0) {
    activeTimerSeconds = timerSeconds;
  }

  timerButton.textContent = "Pausar";
  timerDisplay.textContent = formatTime(activeTimerSeconds);

  timerInterval = setInterval(() => {
    activeTimerSeconds -= 1;
    timerDisplay.textContent = formatTime(activeTimerSeconds);

    if (activeTimerSeconds <= 0) {
      stopTimer();
      timerButton.textContent = "Reiniciar";
      playBell();
      markExerciseCompleted();
    }
  }, 1000);
}

function renderExerciseCategories() {
  exerciseGrid.innerHTML = "";

  Object.entries(categories).forEach(([key, category]) => {
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.dataset.category = key;
    card.innerHTML = `
      <div class="card-title">
        <h3>${category.title}</h3>
        <span>${category.exercises.length} ejercicios</span>
      </div>
      <div class="animation-stage ${category.animation === "passes" ? "double-stage" : ""}">
        ${DrillUp.animationMarkup(category.animation)}
      </div>
      <button type="button">Ver ejercicios</button>
    `;
    card.addEventListener("click", () => renderCategory(key));
    exerciseGrid.appendChild(card);
  });
}

function renderCategory(categoryKey) {
  cancelRoutine();
  currentCategoryKey = categoryKey;
  currentExerciseIndex = 0;
  const category = categories[categoryKey];

  categoryTitle.textContent = category.title;
  categoryDescription.textContent = category.description;
  routineGrid.innerHTML = "";

  category.exercises.forEach((exercise, index) => {
    const card = document.createElement("article");
    card.className = `routine-card ${index === 0 ? "active" : ""}`;
    card.innerHTML = `
      <div class="animation-stage ${category.animation === "passes" ? "double-stage" : ""}">
        ${DrillUp.animationMarkup(category.animation)}
      </div>
      <h3>${exercise.name}</h3>
      <p>${exercise.summary}</p>
    `;
    card.addEventListener("click", () => renderDetail(index));
    routineGrid.appendChild(card);
  });

  DrillUp.showViews(DrillUp.dom.categoryView);
}

function renderDetail(index) {
  const category = categories[currentCategoryKey];
  const exercise = category.exercises[index];
  currentExerciseIndex = index;

  detailCategory.textContent = category.title;
  detailTitle.textContent = exercise.name;
  detailDescription.textContent = exercise.description;
  detailLevel.textContent = exercise.level;
  detailTime.textContent = exercise.time;
  helpText.textContent = exercise.help;
  setupTimer(exercise.time);
  detailAnimation.className = `animation-stage large-stage ${category.animation === "passes" ? "double-stage" : ""}`;
  detailAnimation.innerHTML = DrillUp.animationMarkup(category.animation);
  logActivity("view", `${category.title}: ${exercise.name}`, 0);

  previousExercise.disabled = index === 0;
  nextExercise.disabled = index === category.exercises.length - 1;
  previousExercise.textContent = index === 0 ? "Primer ejercicio" : "← Anterior";
  nextExercise.textContent = index === category.exercises.length - 1 ? "Último ejercicio" : "Siguiente →";

  DrillUp.showViews(DrillUp.dom.detailView);
}

DrillUp.stopTimer = stopTimer;
DrillUp.cancelRoutine = cancelRoutine;

function initExercises() {
  syncExerciseProgress();
  renderExerciseCategories();

  backToHome.addEventListener("click", DrillUp.showHome);
  backToCategory.addEventListener("click", () => renderCategory(currentCategoryKey));
  firstRoutineButton.addEventListener("click", () => {
    startRoutine();
    renderDetail(0);
  });
  timerButton.addEventListener("click", startTimer);
  previousExercise.addEventListener("click", () => {
    if (currentExerciseIndex > 0) {
      renderDetail(currentExerciseIndex - 1);
    }
  });
  nextExercise.addEventListener("click", () => {
    const exercises = categories[currentCategoryKey].exercises;
    if (currentExerciseIndex < exercises.length - 1) {
      renderDetail(currentExerciseIndex + 1);
    }
  });
}

initExercises();
