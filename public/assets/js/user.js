const defaultProfile = {
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  age: "",
  weight: "",
  height: "",
  sex: "",
  dominantHand: "",
  position: "",
  avatar: ""
};

let selectedActivityDate = new Date();
let userSectionInitialized = false;

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getProfile() {
  const key = userKey(USER_PROFILE_BASE);
  if (!key) return { ...defaultProfile };
  return { ...defaultProfile, ...readJson(key, {}) };
}

function getActivity() {
  const key = userKey(ACTIVITY_BASE);
  if (!key) return {};
  return readJson(key, {});
}

function getCompletedExercises() {
  const key = userKey(COMPLETED_EXERCISES_BASE);
  if (!key) return [];
  return readJson(key, []);
}

function getExerciseCategories() {
  return window.DRILLUP_EXERCISES?.categories || {};
}

function getTotalExercises() {
  return Object.values(getExerciseCategories()).reduce((total, category) => total + category.exercises.length, 0);
}

function calculateAge(birthDate) {
  if (!birthDate) return "";
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? String(age) : "";
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function formatMissing(value, suffix = "") {
  return value ? `${value}${suffix}` : "Sin registrar";
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "Sin registrar";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  if (y.length !== 4 || m.length !== 2 || d.length !== 2) return dateStr;
  return `${d}/${m}/${y}`;
}

function normalizeHeight(value) {
  if (!value) return "";
  const str = String(value).trim().replace(",", ".");
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return "";
  if (num < 3) return String(Math.round(num * 100));
  return String(Math.round(num));
}

function heightToDisplay(cm) {
  if (!cm) return "";
  const h = parseFloat(cm);
  if (isNaN(h) || h <= 0) return "";
  return (h / 100).toFixed(2);
}

let sessionStart = null;
let sessionTimer = null;
let sessionCarry = 0;

function addMinutes(extra) {
  if (!extra || extra < 1) return;
  const activity = getActivity();
  const key = todayKey();
  const day = activity[key] || { date: key, views: 0, completions: 0, minutes: 0, items: [] };
  day.minutes += extra;
  activity[key] = day;
  writeJson(userKey(ACTIVITY_BASE), activity);
}

function saveElapsedSession() {
  if (sessionStart === null) return;
  const now = Date.now();
  sessionCarry += Math.floor((now - sessionStart) / 1000);
  sessionStart = now;
  const wholeMinutes = Math.floor(sessionCarry / 60);
  if (wholeMinutes >= 1) {
    addMinutes(wholeMinutes);
    sessionCarry -= wholeMinutes * 60;
    try { syncStatsUI(); } catch (e) { console.warn("syncStatsUI failed", e); }
    try { renderUsageWeek(); } catch (e) { console.warn("renderUsageWeek failed", e); }
  }
  persistCarry();
}

function persistCarry() {
  const carryKey = userKey("drillup-sports-carry");
  if (!carryKey) return;
  if (sessionCarry > 0) {
    writeJson(carryKey, { carry: sessionCarry });
  } else {
    localStorage.removeItem(carryKey);
  }
}

function startSessionTimer() {
  const carryKey = userKey("drillup-sports-carry");
  if (carryKey) {
    const saved = readJson(carryKey, {});
    sessionCarry = typeof saved.carry === "number" ? saved.carry : 0;
  }
  sessionStart = Date.now();
  sessionTimer = setInterval(saveElapsedSession, 60000);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveElapsedSession();
      sessionStart = null;
      if (sessionTimer) { clearInterval(sessionTimer); sessionTimer = null; }
    } else {
      sessionStart = Date.now();
      if (!sessionTimer) sessionTimer = setInterval(saveElapsedSession, 60000);
    }
  });

  window.addEventListener("beforeunload", saveElapsedSession);
}

function logVisit() {
  const activity = getActivity();
  const key = todayKey();
  const day = activity[key] || { date: key, views: 0, completions: 0, minutes: 0, items: [] };
  const last = day.items[0];
  const now = Date.now();

  if (!last || last.type !== "visit" || now - new Date(last.at).getTime() > 10 * 60 * 1000) {
    day.views += 1;
    day.items.unshift({
      type: "visit",
      label: `Ingreso a ${location.hash || "#ejercicios"}`,
      at: new Date().toISOString()
    });
    day.items = day.items.slice(0, 10);
    activity[key] = day;
    writeJson(userKey(ACTIVITY_BASE), activity);
  }
}

function statsFromActivity() {
  const activityDays = Object.values(getActivity());
  const minutes = activityDays.reduce((total, day) => total + (day.minutes || 0), 0);
  const completions = getCompletedExercises().length;
  const completedRoutines = readJson(userKey(COMPLETED_ROUTINES_BASE), []);
  const progress = Math.round((completions / Math.max(1, getTotalExercises())) * 100);

  return {
    routines: completedRoutines.length || Math.floor(completions / 5),
    exercises: completions,
    hours: Math.floor(minutes / 60),
    progress
  };
}

// Las URLs de Googleusercontent vienen con tamaño s96-c; lo subimos a s256-c para mejor nitidez
function upgradeGooglePhotoUrl(url) {
  return (url && url.includes("googleusercontent.com") && url.includes("=s"))
    ? url.replace(/=s\d+-c$/, "=s256-c")
    : url;
}

function applyAvatar(target, profile, fallbackText) {
  if (!target) return;

  target.innerHTML = "";

  // Prioridad: foto personalizada DrillUp > Google (Firebase Auth) > compatibilidad legacy
  const photoUrl = profile.avatar || auth.currentUser?.photoURL || profile.photo || getSession()?.foto || "";

  if (photoUrl) {
    const image = document.createElement("img");
    image.src = upgradeGooglePhotoUrl(photoUrl);
    image.alt = "";
    image.onerror = () => {
      if (target.contains(image)) {
        target.innerHTML = "";
        target.textContent = fallbackText;
      }
    };
    target.appendChild(image);
    return;
  }

  target.textContent = fallbackText;
}

function syncProfileUI(profile = getProfile()) {
      const session = getSession();

    const firstName = profile.firstName || session?.nombre || "Usuario";
    const lastName = profile.lastName || "";

    const fullName = `${firstName} ${lastName}`.trim();

    const initials = `${firstName[0] || "U"}${lastName[0] || ""}`
        .toUpperCase()
        .slice(0, 2);

    const sessionEmail = session?.email || "";
  const age = profile.age || calculateAge(profile.birthDate);

  setText("#profileName", fullName);
  setText("#profileEmail", sessionEmail || profile.email || "Invitado");
  setText(".user-email", sessionEmail || profile.email || "Invitado");

  applyAvatar(document.querySelector("#profileAvatar"), profile, initials);
  applyAvatar(document.querySelector(".user-avatar"), profile, initials);
  applyAvatar(document.querySelector("#avatarLargeContent"), profile, initials);

  setText("#profileFirstName", formatMissing(profile.firstName));
  setText("#profileLastName", formatMissing(profile.lastName));
  setText("#profileBirthDate", formatDateDisplay(profile.birthDate));
  setText("#profileAge", formatMissing(age, age ? " años" : ""));
  setText("#profileWeight", formatMissing(profile.weight, profile.weight ? " kg" : ""));
  const displayHeight = profile.height ? heightToDisplay(profile.height) + " m" : "Sin registrar";
  setText("#profileHeight", displayHeight);
  setText("#profileSex", formatMissing(profile.sex));
  setText("#profileHand", formatMissing(profile.dominantHand));
  setText("#profilePosition", formatMissing(normalizePosition(profile.position)));
}

function syncStatsUI() {
  const stats = statsFromActivity();
  const activityDates = Object.entries(getActivity())
    .filter(([, day]) => (day.completions || 0) > 0)
    .map(([date]) => date)
    .sort();
  const evolutionValues = [
    `${calculateCurrentStreak(activityDates)} días`,
    `${calculateBestStreak(activityDates)} días`,
    activityDates[0] ? formatDateDisplay(activityDates[0]) : "Sin registrar",
    activityDates.at(-1) ? formatDateDisplay(activityDates.at(-1)) : "Sin registrar",
    stats.routines
  ];

  setText("#statRoutines", stats.routines);
  setText("#statExercises", stats.exercises);
  setText("#statHours", `${stats.hours} h`);
  setText("#statProgress", `${stats.progress}%`);
  setText("#progressLabel", `${stats.progress}%`);

  const progressFill = document.querySelector("#progressFill");
  if (progressFill) progressFill.style.width = `${stats.progress}%`;

  setText("#currentStreak", evolutionValues[0]);
  setText("#bestStreak", evolutionValues[1]);
  setText("#firstTrainingDate", evolutionValues[2]);
  setText("#lastTrainingDate", evolutionValues[3]);
  setText("#evolutionRoutines", stats.routines);

  document.querySelectorAll(".evolution-grid strong").forEach((item, index) => {
    if (evolutionValues[index] !== undefined) item.textContent = evolutionValues[index];
  });
}

function calculateCurrentStreak(dates) {
  if (!dates.length) return 0;
  const dateSet = new Set(dates);
  const cursor = new Date();
  let streak = 0;

  while (dateSet.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateBestStreak(dates) {
  if (!dates.length) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = new Date(`${dates[index - 1]}T00:00:00`);
    const next = new Date(`${dates[index]}T00:00:00`);
    previous.setDate(previous.getDate() + 1);

    if (todayKey(previous) === todayKey(next)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function normalizePosition(value) {
  if (!value) return "";
  const lower = value.toLowerCase().trim();
  if (lower === "escolta") return "Escolta (SG)";
  return value;
}

function fillProfileForm(profile = getProfile()) {
  const normalized = {
    ...profile,
    position: normalizePosition(profile.position)
  };

  const fields = {
    firstNameInput: normalized.firstName,
    lastNameInput: normalized.lastName,
    birthDateInput: normalized.birthDate,
    ageInput: normalized.age || calculateAge(normalized.birthDate),
    weightInput: normalized.weight,
    heightInput: normalized.height ? heightToDisplay(normalized.height) : "",
    sexInput: normalized.sex,
    handInput: normalized.dominantHand,
    positionInput: normalized.position
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) field.value = value || "";
  });
}

function showProfileForm() {
  const formPanel = document.querySelector("#profileFormPanel");
  if (!formPanel) return;

  fillProfileForm();
  formPanel.hidden = false;
  formPanel.removeAttribute("hidden");
  formPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideProfileForm() {
  const formPanel = document.querySelector("#profileFormPanel");
  if (formPanel) formPanel.hidden = true;
}

function saveProfileFromForm() {
  const rawHeight = document.querySelector("#heightInput")?.value || "";
  const normalizedHeight = normalizeHeight(rawHeight);
  if (rawHeight && !normalizedHeight) {
    alert("Altura inválida. Usa formato: 180, 1.80 o 1,80");
    return;
  }
  if (normalizedHeight && (parseFloat(normalizedHeight) < 100 || parseFloat(normalizedHeight) > 272)) {
    alert("Altura fuera de rango (1.00 - 2.72 m)");
    return;
  }

  const previous = getProfile();
  const profile = {
    ...previous,
    firstName: document.querySelector("#firstNameInput")?.value.trim() || "",
    lastName: document.querySelector("#lastNameInput")?.value.trim() || "",
    birthDate: document.querySelector("#birthDateInput")?.value || "",
    age: document.querySelector("#ageInput")?.value || "",
    weight: document.querySelector("#weightInput")?.value || "",
    height: normalizedHeight,
    sex: document.querySelector("#sexInput")?.value || "",
    dominantHand: document.querySelector("#handInput")?.value || "",
    position: normalizePosition(document.querySelector("#positionInput")?.value.trim() || "")
  };

  if (!profile.age) profile.age = calculateAge(profile.birthDate);
  writeJson(userKey(USER_PROFILE_BASE), profile);
  syncProfileUI(profile);
  hideProfileForm();
}

function initProfileForm() {
  const editButton = document.querySelector("#editProfileButton");
  const cancelButton = document.querySelector("#cancelProfileButton");
  const form = document.querySelector("#profileForm");

  editButton?.addEventListener("click", () => {
    showProfileForm();
  });

  cancelButton?.addEventListener("click", () => {
    hideProfileForm();
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfileFromForm();
  });
}

function activityForDate(date) {
  return getActivity()[todayKey(date)] || { views: 0, completions: 0, minutes: 0, items: [] };
}

function describeDay(date) {
  const data = activityForDate(date);
  const label = date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" });
  const hours = Math.floor((data.minutes || 0) / 60);
  const minutes = (data.minutes || 0) % 60;
  const time = `${hours} h, ${String(minutes).padStart(2, "0")} min`;

  if (!data.items.length) {
    return { label, time, detail: `${label}: 0 minutos de actividad.` };
  }

  const details = data.items.slice(0, 3).map((item) => item.label).join(" | ");
  return {
    label,
    time,
    detail: `${label}: ${data.views} ingresos, ${data.completions || 0} ejercicios completados. ${details}`
  };
}

function weekDates(centerDate) {
  const date = new Date(centerDate);
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(sunday);
    current.setDate(sunday.getDate() + index);
    return current;
  });
}

function formatGridLabel(minutes) {
  if (minutes === 0) return "0";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function chooseScale(weeklyMax) {
  if (weeklyMax <= 240) return { max: 240, step: 30 };
  const max = Math.ceil(weeklyMax / 60) * 60;
  return { max, step: 60 };
}

function renderUsageWeek() {
  const days = [...document.querySelectorAll(".screen-day")];
  const dates = weekDates(selectedActivityDate);
  const today = new Date();
  const todayStamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const weeklyMins = dates.map(d => (activityForDate(d).minutes || 0));
  const weekMax = Math.max(...weeklyMins, 1);
  const { max: maxScale, step } = chooseScale(weekMax);

  const gridContainer = document.querySelector(".screen-grid-lines");
  if (gridContainer) {
    gridContainer.innerHTML = "";
    const totalLabels = maxScale / step;
    for (let i = 0; i <= totalLabels; i++) {
      const mins = Math.round(maxScale - i * step);
      const percent = (i / totalLabels) * 100;
      const span = document.createElement("span");
      span.style.top = `${percent}%`;
      span.textContent = formatGridLabel(mins);
      gridContainer.appendChild(span);
    }
  }

  days.forEach((dayElement, index) => {
    const date = dates[index];
    const stamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const isFuture = stamp > todayStamp;
    const activity = activityForDate(date);
    const info = describeDay(date);
    const bar = dayElement.querySelector(".screen-bar");
    const label = dayElement.querySelector("span:last-child");
    const height = isFuture ? 0 : Math.min(100, ((activity.minutes || 0) / maxScale) * 100);

    dayElement.classList.remove("active", "selected");
    dayElement.classList.toggle("is-future", isFuture);
    dayElement.dataset.time = isFuture ? "0 h, 00 min" : info.time;
    dayElement.dataset.day = date.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "");
    dayElement.dataset.detail = isFuture ? "Aun no hay datos para dias futuros." : info.detail;
    dayElement.dataset.date = todayKey(date);

    if (bar) {
      bar.style.height = `${height}%`;
      bar.classList.toggle("empty", !activity.minutes || isFuture);
    }

    if (label) label.textContent = dayElement.dataset.day;
  });

  const selectedInfo = describeDay(selectedActivityDate);
  setText("#selectedUsageTime", selectedInfo.time);
  setText("#selectedUsageLabel", todayKey(selectedActivityDate) === todayKey() ? "Hoy" : selectedInfo.label);
  setText("#weeklyStatDetail", selectedInfo.detail);

  const footerLabel = document.querySelector(".screen-time-footer > span");
  if (footerLabel) {
    footerLabel.textContent = selectedActivityDate.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }

  const nextButton = document.querySelector(".screen-time-footer button:last-child");
  const displayedWeek = weekDates(selectedActivityDate);
  const includesToday = displayedWeek.some((d) => todayKey(d) === todayKey());
  if (nextButton) nextButton.disabled = includesToday;
}

function categoryPercentagesFromProgress() {
  const categories = getExerciseCategories();
  const completed = getCompletedExercises();

  return Object.keys(categories).map((categoryKey) => {

    const totalCategoryExercises = categories[categoryKey].length;

    const completedInCategory = completed.filter(id =>
      id.startsWith(`${categoryKey}:`)
    );

    // eliminar duplicados
    const uniqueCompleted = [...new Set(completedInCategory)];

    return Math.min(
    100,
    Math.round(
        (uniqueCompleted.length / Math.max(1, totalCategoryExercises)) * 100
    )
);
  });
}

function renderCategoryProgress() {
  const rows = [...document.querySelectorAll(".category-row")];
  const percentages = categoryPercentagesFromProgress();
  const categoryDetail = document.querySelector("#categoryStatDetail");

  rows.forEach((row, index) => {
    const percentage = percentages[index] || 0;
    const title = row.querySelector("span")?.textContent || "Categoria";
    const bar = row.querySelector(".usage-bar > div");
    const small = row.querySelector("small");

    if (bar) bar.style.width = `${percentage}%`;
    if (small) small.textContent = `${percentage}%`;

    row.tabIndex = 0;
    row.setAttribute("role", "button");

    const update = () => {
      rows.forEach((item) => item.classList.remove("selected"));
      row.classList.add("selected");
      if (categoryDetail) categoryDetail.textContent = `${title}: aporta ${percentage}% al progreso general.`;
    };

    row.onmouseenter = update;
    row.onclick = update;
    row.onfocus = update;
  });
}

function initUsageInteractions() {
  const days = [...document.querySelectorAll(".screen-day")];

  days.forEach((day) => {
    day.tabIndex = 0;
    day.setAttribute("role", "button");

    const update = () => {
      if (day.classList.contains("is-future")) return;
      days.forEach((item) => item.classList.remove("selected"));
      day.classList.add("selected");
      if (day.dataset.date) selectedActivityDate = new Date(`${day.dataset.date}T00:00:00`);
      setText("#selectedUsageTime", day.dataset.time || "0 h, 00 min");
      setText("#selectedUsageLabel", day.dataset.day || "");
      setText("#weeklyStatDetail", day.dataset.detail || "");
    };

    day.addEventListener("mouseenter", update);
    day.addEventListener("click", update);
  });

  const footerButtons = document.querySelectorAll(".screen-time-footer button");
  footerButtons[0]?.addEventListener("click", () => {
    const prevDate = new Date(selectedActivityDate);
    prevDate.setDate(prevDate.getDate() - 7);
    selectedActivityDate = prevDate;
    renderUsageWeek();
  });

  footerButtons[1]?.addEventListener("click", () => {
    const nextDate = new Date(selectedActivityDate);
    nextDate.setDate(nextDate.getDate() + 7);
    // Comparar contra el domingo de la SIGUIENTE semana, no contra la fecha+7
    // Así evita que sábado+7 caiga en futuro y bloquee el avance
    const nextSunday = weekDates(nextDate)[0];
    if (todayKey(nextSunday) <= todayKey()) {
      selectedActivityDate = nextDate;
      renderUsageWeek();
    }
  });
}

function initStatsInteractions() {
  const details = {
    routines: "Rutinas estimadas a partir de cada 5 ejercicios completados.",
    exercises: "Ejercicios completados: sube cuando terminas el tiempo o todas las repeticiones.",
    hours: "Tiempo acumulado por ingresos y ejercicios registrados en el frontend.",
    progress: "Progreso general: ejercicios completados dividido entre todos los ejercicios disponibles."
  };
  const cards = [...document.querySelectorAll(".stat-card[data-stat]")];
  const feedback = document.querySelector("#statsFeedback");

  cards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const update = () => {
      cards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      if (feedback) feedback.textContent = details[card.dataset.stat] || "";
    };

    card.addEventListener("mouseenter", update);
    card.addEventListener("click", update);
  });
}

function showAvatarModal() {
  const modal = document.querySelector("#avatarModal");
  if (!modal) return;

  syncProfileUI();
  modal.hidden = false;
  modal.removeAttribute("hidden");
}

function hideAvatarModal() {
  const modal = document.querySelector("#avatarModal");
  if (modal) modal.hidden = true;
}

function chooseAvatarFile() {
  document.querySelector("#avatarFileInput")?.click();
}

function initAvatar() {
  const input = document.querySelector("#avatarFileInput");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5 MB.");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const profile = { ...getProfile(), avatar: reader.result };
      writeJson(userKey(USER_PROFILE_BASE), profile);
      syncProfileUI(profile);
      hideAvatarModal();
    };
    reader.readAsDataURL(file);
  });
}

function initLogout() {
  const modal = document.querySelector("#logoutModal");
  document.querySelector("#logoutButton")?.addEventListener("click", () => {
    modal.hidden = false;
  });
  document.querySelector("#cancelLogout")?.addEventListener("click", () => {
    modal.hidden = true;
  });
  document.querySelector("#confirmLogout")?.addEventListener("click", () => {
    modal.hidden = true;
    if (typeof logout === "function") {
      logout();
    } else {
      localStorage.removeItem("usuario");
      localStorage.removeItem("rol");
      localStorage.removeItem("nombre");
      window.location.href = "/login";
    }
  });
}

function initDelegatedActions() {
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.closest("#profileAvatar")) {
      event.preventDefault();
      showAvatarModal();
      return;
    }

    if (target.closest("#closeAvatarModal")) {
      event.preventDefault();
      hideAvatarModal();
      return;
    }

    if (target.closest("#changeAvatarButton")) {
      event.preventDefault();
      chooseAvatarFile();
      return;
    }

    if (target.closest("#avatarModal") && !target.closest(".avatar-modal-card")) {
      hideAvatarModal();
    }

    if (target.closest("#logoutModal") && !target.closest(".logout-card")) {
      document.querySelector("#logoutModal").hidden = true;
    }
  });
}

function initLinkGoogle() {
  const btn = document.querySelector("#linkGoogleButton");
  if (!btn) return;

  if (isGuest()) {
    const uid = getSession()?.uid;
    const guestEntry = getGuestIndex().find(g => g.id === uid);
    if (guestEntry?.migrated) { btn.hidden = true; return; }
    btn.hidden = false;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Vinculando...";
      try {
        await migrateGuestToGoogle();
        window.location.reload();
      } catch (err) {
        if (err.message !== "Cerraste la ventana de Google antes de completar el inicio.") {
          alert(err.message);
        }
        btn.disabled = false;
        btn.textContent = "Vincular Google";
      }
    });
    return;
  }

  try {
    btn.hidden = hasGoogleLinked();
  } catch { btn.hidden = true; }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Vinculando...";
    try {
      await linkGoogleAccount();
      btn.hidden = true;
      syncProfileUI();
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.textContent = "Vincular Google";
    }
  });
}


function initSecuritySection() {
  if (isGuest()) {
    const body = document.querySelector(".security-body");
    if (body) {
      body.innerHTML = '<p style="color:var(--muted);margin:0">Estás navegando como invitado. Todos tus datos se guardan localmente en este dispositivo.</p>';
    }
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) return;

  const emailEl = document.querySelector("#securityMainEmail");
  if (emailEl) emailEl.textContent = user.email || "";

  const list = document.querySelector("#securityProvidersList");
  if (!list) return;

  list.innerHTML = "";
  const providers = user.providerData || [];

  providers.forEach((p) => {
    const div = document.createElement("div");
    div.className = "security-provider";

    const label = { password: "Email y contraseña" }[p.providerId] || p.providerId;

    div.innerHTML = `
      <span class="provider-icon">✓</span>
      <div class="provider-info">
        <strong class="provider-name">${label}</strong>
        ${p.email && p.providerId !== "password" ? `<span class="provider-email">${p.email}</span>` : ""}
      </div>`;
    list.appendChild(div);
  });

}

function refreshUserDashboard() {
  syncStatsUI();
  renderUsageWeek();
  renderCategoryProgress();
}

async function waitForAuth() {
  if (isGuest()) return;
  await new Promise((resolve) => {
    const handler = (e) => {
      if (e.detail && e.detail.user) {
        window.removeEventListener("auth-ready", handler);
        resolve();
      }
    };
    window.addEventListener("auth-ready", handler);
    setTimeout(() => { window.removeEventListener("auth-ready", handler); resolve(); }, 10000);
  });
}

function syncAdminLink() {
  try {
    const container = document.querySelector("#adminLinkContainer");
    if (!container) return;

    const s = getSession();
    const email = s?.email || "(sin sesión)";
    const rol = s?.rol || "none";
    const isAdmin = rol === "admin";

    if (isAdmin) {
      container.innerHTML = '<a href="/admin"><span class="nav-icon">⚙</span>Panel Admin</a>';
    } else {
      container.innerHTML = "";
    }
  } catch (e) { console.warn("admin link sync failed", e); }
}

async function initUserSection() {
  if (userSectionInitialized) {
    syncAdminLink();
    refreshUserDashboard();
    return;
  }

  window.addEventListener("auth-ready", () => {
    if (userSectionInitialized) {
      try { syncProfileUI(); } catch (e) { console.warn("re-sync profileUI failed", e); }
      syncAdminLink();
      try { initSecuritySection(); } catch (e) { console.warn("re-sync security failed", e); }
      try { refreshUserDashboard(); } catch (e) { console.warn("re-sync dashboard failed", e); }
    }
  });

  await waitForAuth();
  userSectionInitialized = true;

  try { indexedDB.deleteDatabase("drillup-sports-videos"); } catch {} // limpieza base antigua no scoperda
  try { if (typeof checkGuestIntegrity === "function") checkGuestIntegrity(); } catch {}

  try { logVisit(); } catch (e) { console.warn("logVisit failed", e); }
  try { syncProfileUI(); } catch (e) { console.warn("syncProfileUI failed", e); }
  syncAdminLink();
  try { initSecuritySection(); } catch (e) { console.warn("initSecuritySection failed", e); }
  try { initProfileForm(); } catch (e) { console.warn("initProfileForm failed", e); }
  try { initAvatar(); } catch (e) { console.warn("initAvatar failed", e); }
  try { initLogout(); } catch (e) { console.warn("initLogout failed", e); }
  try { initLinkGoogle(); } catch (e) { console.warn("initLinkGoogle failed", e); }
  try { initDelegatedActions(); } catch (e) { console.warn("initDelegatedActions failed", e); }
  try { initStatsInteractions(); } catch (e) { console.warn("initStatsInteractions failed", e); }

  try { refreshUserDashboard(); } catch (e) { console.warn("refreshUserDashboard failed", e); }
  try { initUsageInteractions(); } catch (e) { console.warn("initUsageInteractions failed", e); }
  try { startSessionTimer(); } catch (e) { console.warn("startSessionTimer failed", e); }

  document.body.classList.remove("auth-pending");

  window.addEventListener("hashchange", () => {
    saveElapsedSession();
    logVisit();
    refreshUserDashboard();
  });
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    const c = document.querySelector("#adminLinkContainer");
    if (c) c.innerHTML = "";
    syncAdminLink();
    refreshUserDashboard();
  }
});

window.DrillUp = window.DrillUp || {};
DrillUp.showProfileForm = showProfileForm;
DrillUp.showAvatarModal = showAvatarModal;
DrillUp.refreshUserStats = refreshUserDashboard;

function safeInit() {
  initUserSection().catch((e) => console.error("initUserSection failed", e));
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", safeInit);
} else {
  safeInit();
}

async function logout() {

    try {

        if (!isGuest() && auth.currentUser) {
            await auth.signOut();
        }

    } catch (e) {
        console.warn(e);
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("uid");
    localStorage.removeItem("usuario");
    localStorage.removeItem("nombre");
    localStorage.removeItem("foto");
    localStorage.removeItem("rol");

    window.location.href = "/login";
}