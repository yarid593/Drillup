/* ================================
   DRILLUP SPORTS — ADMIN PANEL JS
   ================================ */

// ======================== STATE ========================
let currentSection = "resume";
const chartInstances = {};
let currentPage = 1;
let searchQuery = "";
let statusFilter = "";

// ======================== DATA PERSISTENCE (localStorage) ========================
// When the backend is added, replace these functions with API calls.
const ADMIN_STORE = {
  exercises: "admin_exercises_data",
  signals: "admin_signals_data",
  plays: "admin_plays_data",
};

function getAdminStore(type) {
  try {
    const raw = localStorage.getItem(ADMIN_STORE[type]);
    return raw ? JSON.parse(raw) : { custom: [], deleted: [], edited: {} };
  } catch {
    return { custom: [], deleted: [], edited: {} };
  }
}

function saveAdminStore(type, data) {
  try {
    localStorage.setItem(ADMIN_STORE[type], JSON.stringify(data));
    showAdminFeedback("Guardado correctamente");
  } catch (e) {
    showAdminFeedback("Error al guardar: espacio insuficiente en el almacenamiento local", true);
  }
}

function showAdminFeedback(msg, isError) {
  const existing = document.querySelector("#adminToast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "adminToast";
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-weight:500;z-index:99999;transition:opacity .3s;background:${isError ? "#991b1b" : "#166534"};color:#fff`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2500);
}

// Exercises: merged built-in + admin custom - deleted
function getExercises() {
  if (!window.DRILLUP_EXERCISES || !window.DRILLUP_EXERCISES.categories) return null;
  const builtIn = window.DRILLUP_EXERCISES.categories;
  const admin = getAdminStore("exercises");
  const merged = {};

  for (const [key, cat] of Object.entries(builtIn)) {
    const items = cat.exercises || [];
    const filtered = items.filter((_, idx) => !admin.deleted.includes(key + "-" + idx));
    const edited = filtered.map((ex, idx) => {
      const editId = key + "-" + idx;
      return admin.edited[editId] ? { ...ex, ...admin.edited[editId] } : ex;
    });
    merged[key] = { ...cat, exercises: edited };
  }

  if (admin.custom && admin.custom.length > 0) {
    const customFiltered = admin.custom.filter(ex => !admin.deleted.includes(ex.id));
    const customEdited = customFiltered.map(ex =>
      admin.edited[ex.id] ? { ...ex, ...admin.edited[ex.id] } : ex
    );
    merged["personalizadas"] = {
      title: "Personalizadas",
      description: "Ejercicios creados por el administrador",
      exercises: customEdited,
    };
  }

  return merged;
}

// Signals: merged built-in + admin custom - deleted
function getSignals() {
  if (!window.DRILLUP_SIGNALS || !Array.isArray(window.DRILLUP_SIGNALS)) return null;
  const builtIn = window.DRILLUP_SIGNALS;
  const admin = getAdminStore("signals");
  const filtered = builtIn.filter(s => !admin.deleted.includes(s.id));
  const edited = filtered.map(s => admin.edited[s.id] ? { ...s, ...admin.edited[s.id] } : s);
  return [...edited, ...admin.custom];
}

// Plays: merged built-in + admin custom - deleted
function getPlays() {
  if (!window.DRILLUP_PLAYS || !Array.isArray(window.DRILLUP_PLAYS)) return null;
  const builtIn = window.DRILLUP_PLAYS;
  const admin = getAdminStore("plays");
  const filtered = builtIn.filter(p => !admin.deleted.includes(p.id));
  const edited = filtered.map(p => admin.edited[p.id] ? { ...p, ...admin.edited[p.id] } : p);
  return [...edited, ...admin.custom];
}

function getNextCustomId(items) {
  const maxId = items.reduce((max, item) => {
    const match = (item.id || "").match(/^custom-(\d+)$/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return "custom-" + (maxId + 1);
}

// ======================== HELPERS ========================
function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function statusBadge(status) {
  const map = {
    active: "badge-active",
    inactive: "badge-inactive",
    published: "badge-published",
    draft: "badge-draft",
    beginner: "badge-beginner",
    intermediate: "badge-intermediate",
    advanced: "badge-advanced",
  };
  const cls = map[status] || "badge-active";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge ${cls}">${label}</span>`;
}

function normalizeLevel(level) {
  const map = {
    "nivel básico": "beginner",
    "nivel intermedio": "intermediate",
    "nivel avanzado": "advanced",
    "básico": "beginner",
    "intermedio": "intermediate",
    "avanzado": "advanced",
  };
  return map[level.toLowerCase()] || level;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ======================== MODAL ========================
function showModal(title, bodyHTML, footerHTML) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" data-close-modal>✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ""}
    </div>
  `;
  overlay.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", () => overlay.remove());
  });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.addEventListener("focusin", (e) => {
    if (e.target.matches(".form-input, .form-select, .form-textarea")) {
      e.target.style.borderColor = "";
    }
  });
  document.body.appendChild(overlay);
  return overlay;
}

// ======================== PAGINATION ========================
function renderPagination(total, page, perPage) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return "";

  let html = '<div class="pagination">';
  html += `<button ${page <= 1 ? "disabled" : ""} data-page="${page - 1}">‹</button>`;

  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);

  if (start > 1) {
    html += `<button data-page="1">1</button>`;
    if (start > 2) html += `<span class="page-info">...</span>`;
  }
  for (let i = start; i <= end; i++) {
    html += `<button class="${i === page ? "active-page" : ""}" data-page="${i}">${i}</button>`;
  }
  if (end < pages) {
    if (end < pages - 1) html += `<span class="page-info">...</span>`;
    html += `<button data-page="${pages}">${pages}</button>`;
  }

  html += `<button ${page >= pages ? "disabled" : ""} data-page="${page + 1}">›</button>`;
  html += "</div>";
  return html;
}

function attachPagination(container, onChange) {
  container.querySelectorAll(".pagination button:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", () => onChange(parseInt(btn.dataset.page)));
  });
}

// ======================== SECTION: RESUME ========================
/*
 * Architectural note: When the backend (PHP + PostgreSQL) is connected,
 * replace the pending cards below with real data fetched via REST API.
 *
 * Expected endpoints:
 *   GET /api/admin/stats           → { totalUsers, activeToday, weeklyHours }
 *   GET /api/admin/activity        → [{ timestamp, user, action, detail }]
 *   GET /api/admin/users           → [{ id, name, email, avatar, lastLogin }]
 *
 * The statCard() / pendingCard() helpers centralise the markup so migration
 * only requires replacing the value argument with a live API response field.
 */

function statCard(icon, value, label, sub) {
  return `
    <div class="dashboard-card">
      <div class="card-icon">${icon}</div>
      <div class="card-value">${value}</div>
      <div class="card-label">${label}</div>
      ${sub ? `<div class="card-sub">${sub}</div>` : ""}
    </div>
  `;
}

function pendingCard(icon, label, hint) {
  return `
    <div class="dashboard-card card-pending">
      <div class="card-icon">${icon}</div>
      <div class="card-value">—</div>
      <div class="card-label">${label}</div>
      <div class="card-pending-hint">${hint}</div>
    </div>
  `;
}

function renderResume() {
  const exercises = getExercises();
  const signals = getSignals();
  const plays = getPlays();

  const totalExercises = exercises ? Object.values(exercises).reduce((sum, cat) => sum + (cat.exercises ? cat.exercises.length : 0), 0) : 0;
  const exerciseCategories = exercises ? Object.keys(exercises).length : 0;

  document.getElementById("pageTitle").textContent = "Resumen General";

  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <div class="dashboard-cards">
      ${pendingCard("👥", "Usuarios registrados", "Total de cuentas activas en la plataforma — disponible con backend PostgreSQL")}
      ${pendingCard("✅", "Usuarios activos hoy", "Usuarios que iniciaron sesión en el día actual — disponible con backend")}
      ${statCard("🏀", totalExercises, "Ejercicios", `${exerciseCategories} categorías`)}
      ${statCard("🚩", signals ? signals.length : "—", "Señales arbitrales")}
      ${statCard("📋", plays ? plays.length : "—", "Jugadas")}
      ${pendingCard("⏱", "Horas entrenadas esta semana", "Suma de horas de todos los usuarios (lun 00:00 – dom 23:59) — disponible con backend")}
    </div>

    <h3 class="section-title">Actividad reciente</h3>
    <div id="recentActivityContainer">
      <div class="activity-empty">
        <div class="activity-empty-icon">📭</div>
        <p>Cuando DrillUp Sports esté conectado al backend, aquí aparecerán los eventos más recientes de la plataforma.</p>
      </div>
    </div>

    <!--
      Activity item template (for backend integration):
      <div class="activity-list">
        <div class="activity-item">
          <span class="activity-icon activity-register"></span>
          <div class="activity-info">
            <span class="activity-desc">Nombre del usuario realizó una acción</span>
            <span class="activity-time">24/06/2026 - 12:32 AM</span>
          </div>
        </div>
      </div>
    -->
  `;
}

// ======================== SECTION: USERS ========================
/*
 * @todo-backend: Replace with real data from GET /api/admin/users
 *
 * Expected endpoints:
 *   GET /api/admin/users           → [{ id, name, email, avatar, isAdmin, registeredAt, lastLogin }]
 *   GET /api/admin/users/{id}      → { id, name, email, avatar, isAdmin, registeredAt, lastLogin, profile }
 *   GET /api/admin/users/{id}/stats     → { totalRoutines, totalExercises, totalMinutes, lastActivity }
 *   GET /api/admin/users/{id}/categories → [{ category, count }]
 *   GET /api/admin/users/{id}/activity   → [{ timestamp, type, label, minutes }]
 *
 * Current implementation reads guest profiles from the guest index (localStorage)
 * plus the current Firebase session (admin user). When the backend is connected,
 * replace getAvailableUsers() with a fetch() to the API and remove the
 * localStorage-based fallback.
 */
function getAvailableUsers() {
  const session = getSession();
  const guestIndex = getGuestIndex();
  const admins = new Set(ADMIN_EMAILS.map(e => e.toLowerCase()));
  const users = [];
  const seen = new Set();

  // Current admin (Firebase session)
  if (session && session.email) {
    users.push({
      uid: session.uid,
      name: session.nombre || "Usuario",
      email: session.email,
      avatar: session.foto || "",
      role: admins.has(session.email.toLowerCase()) ? "admin" : "user",
      registeredAt: null,
      lastActive: null,
      source: "firebase",
      migrated: false
    });
    seen.add(session.email.toLowerCase());
  }

  // Guest profiles
  guestIndex.forEach(g => {
    let email = (g.email || "").toLowerCase();
    let avatar = "";
    const isMigrated = !!g.migrated && !!g.pgUserId;

    // For migrated profiles, try to resolve email from Firebase profile
    if ((!email || !g.email) && isMigrated) {
      const fbProfile = readJson(`${USER_PROFILE_BASE}-${g.pgUserId}`, {});
      if (fbProfile.email) {
        email = fbProfile.email.toLowerCase();
        avatar = fbProfile.avatar || "";
      }
    }

    if (email && seen.has(email)) return;
    if (email) seen.add(email);

    users.push({
      uid: g.id,
      name: g.name || "",
      email: email,
      avatar: avatar,
      role: email && admins.has(email) ? "admin" : "user",
      registeredAt: g.created || null,
      lastActive: g.lastActive || null,
      source: "guest",
      migrated: isMigrated,
      pgUserId: g.pgUserId || null
    });
  });

  // Sort alphabetically by name
  users.sort((a, b) => a.name.localeCompare(b.name, "es"));

  return users;
}

function userRowHtml(user) {
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const avatar = user.avatar
    ? `<img src="${user.avatar}" alt="${user.name}">`
    : initial;
  const hasActiveLink = user.migrated && !!user.email;
  const isLocal = user.source === "guest" && !hasActiveLink;
  const badgeClass = user.role === "admin" ? "admin" : (hasActiveLink ? "migrated" : "guest");
  const badgeText = user.role === "admin" ? "Admin" : (hasActiveLink ? "Vinculado" : "Perfil local");
  const emailDisplay = !user.email
    ? (isLocal ? "Sin correo <span style=\"opacity:0.5\">•</span> Perfil local" : "Sin correo")
    : user.email;
  return `
    <div class="user-row" data-user-uid="${user.uid}">
      <div class="user-row-avatar">${avatar}</div>
      <div class="user-row-info">
        <div class="user-row-name">${user.name || "Sin nombre"}</div>
        <div class="user-row-email">${emailDisplay}</div>
      </div>
      <span class="user-row-badge ${badgeClass}">${badgeText}</span>
    </div>
  `;
}

function renderUsers() {
  document.getElementById("pageTitle").textContent = "Gestión de Usuarios";
  const content = document.getElementById("adminContent");

  const allUsers = getAvailableUsers();
  const admins = allUsers.filter(u => u.role === "admin");
  const regulars = allUsers.filter(u => u.role !== "admin");

  // Letter groups for regular users
  const letterGroups = {};
  regulars.forEach(u => {
    const letter = u.name.charAt(0).toUpperCase() || "#";
    if (!letterGroups[letter]) letterGroups[letter] = [];
    letterGroups[letter].push(u);
  });
  const sortedLetters = Object.keys(letterGroups).sort((a, b) => a.localeCompare(b, "es"));

  content.innerHTML = `
    <div class="users-search-wrap">
      <input type="search" class="users-search-input" id="usersSearch"
             placeholder="Buscar por nombre o correo electrónico...">
    </div>
    <div class="users-groups" id="usersGroups">

      <!-- ADMINS -->
      <div class="users-group" data-group="admins">
        <div class="users-group-header">
          <h3>Administradores</h3>
          <span class="users-group-count">${admins.length}</span>
        </div>
        <div class="users-group-body" id="adminsBody">
          ${admins.length === 0
            ? '<p class="users-group-empty">No hay administradores registrados</p>'
            : admins.map(userRowHtml).join("")}
        </div>
      </div>

      <!-- USERS -->
      <div class="users-group" data-group="regulars">
        <div class="users-group-header">
          <h3>Usuarios</h3>
          <span class="users-group-count">${regulars.length}</span>
        </div>
        <div class="users-group-body" id="regularsBody">
          ${regulars.length === 0
            ? '<p class="users-group-empty">No hay usuarios registrados</p>'
            : sortedLetters.map(letter => `
              <div class="users-letter-group" data-letter="${letter}">
                <div class="users-letter-header">${letter}</div>
                ${letterGroups[letter].map(userRowHtml).join("")}
              </div>
            `).join("")}
        </div>
      </div>

      <!-- NO RESULTS (hidden by default) -->
      <div class="users-group" id="noResultsGroup" style="display:none">
        <div class="users-group-body">
          <p class="users-group-empty">No se encontraron usuarios con ese criterio de búsqueda.</p>
        </div>
      </div>
    </div>

    <!-- Architectural note -->
    <p style="margin:20px 0 0;font-size:0.78rem;color:var(--muted);text-align:center;line-height:1.5">
      Los datos mostrados provienen de perfiles locales y la sesión actual.
      Cuando DrillUp Sports esté conectado al backend PostgreSQL,
      <code>GET /api/admin/users</code> proveerá la lista completa de todos los usuarios registrados.
    </p>
  `;

  // Click on user rows
  content.querySelectorAll("[data-user-uid]").forEach(row => {
    row.addEventListener("click", () => renderUserDetail(row.dataset.userUid));
  });

  // Search
  content.querySelector("#usersSearch").addEventListener("input", function () {
    const q = this.value.trim().toLowerCase();
    const adminsGroup = content.querySelector('[data-group="admins"]');
    const regularsGroup = content.querySelector('[data-group="regulars"]');
    const noResults = content.querySelector("#noResultsGroup");

    if (!q) {
      adminsGroup.style.display = "";
      regularsGroup.style.display = "";
      noResults.style.display = "none";
      content.querySelectorAll(".user-row").forEach(r => r.style.display = "");
      content.querySelectorAll(".users-letter-group").forEach(g => g.style.display = "");
      return;
    }

    let visibleCount = 0;

    content.querySelectorAll(".user-row").forEach(row => {
      const name = row.querySelector(".user-row-name")?.textContent?.toLowerCase() || "";
      const email = row.querySelector(".user-row-email")?.textContent?.toLowerCase() || "";
      const match = name.includes(q) || email.includes(q);
      row.style.display = match ? "" : "none";
      if (match) visibleCount++;
    });

    // Hide empty letter groups
    content.querySelectorAll(".users-letter-group").forEach(g => {
      const hasVisible = [...g.querySelectorAll(".user-row")].some(r => r.style.display !== "none");
      g.style.display = hasVisible ? "" : "none";
    });

    // Show/hide groups
    const adminsVisible = [...(adminsGroup?.querySelectorAll(".user-row") || [])].some(r => r.style.display !== "none");
    const regularsVisible = [...regularsGroup?.querySelectorAll(".user-row") || []].some(r => r.style.display !== "none");

    if (adminsGroup) adminsGroup.style.display = adminsVisible ? "" : "none";
    if (regularsGroup) regularsGroup.style.display = regularsVisible ? "" : "none";

    if (noResults) noResults.style.display = visibleCount === 0 ? "" : "none";
  });
}

function getCategoryTitle(catKey) {
  const exerciseCategories = typeof getExerciseCategories === "function" ? getExerciseCategories() : {};
  return exerciseCategories[catKey]?.title || catKey;
}

function renderUserDetail(uid) {
  const allUsers = getAvailableUsers();
  const user = allUsers.find(u => u.uid === uid);
  if (!user) { renderUsers(); return; }

  const profile = readJson(`${USER_PROFILE_BASE}-${uid}`, {});
  const activity = readJson(`${ACTIVITY_BASE}-${uid}`, {});
  const completedExercises = readJson(`${COMPLETED_EXERCISES_BASE}-${uid}`, []);
  const completedRoutines = readJson(`${COMPLETED_ROUTINES_BASE}-${uid}`, []);

  const hasLocal = profile && Object.keys(profile).length > 0;

  const name = user.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Sin nombre";
  const email = user.email || profile.email || "";
  const avatar = user.avatar || profile.avatar || "";
  const initial = name.charAt(0).toUpperCase();
  const hasActiveLink = user.migrated && !!user.email;
  const isLocal = user.source === "guest" && !hasActiveLink;
  const roleLabel = user.role === "admin" ? "Administrador" : "Usuario";
  const roleClass = user.role === "admin" ? "admin" : (hasActiveLink ? "migrated" : "guest");

  // Metrics
  const totalRoutines = completedRoutines.length;
  const totalExercises = completedExercises.length;
  let totalMinutes = 0;
  const allItems = [];

  Object.values(activity).forEach(day => {
    totalMinutes += day.minutes || 0;
    if (day.items) allItems.push(...day.items);
  });
  allItems.sort((a, b) => new Date(b.at) - new Date(a.at));

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeStr = totalMinutes > 0 ? `${hours}h ${String(mins).padStart(2, "0")}m` : "—";
  const lastActivity = allItems.length > 0 ? allItems[0].at : null;

  // Category breakdown
  const catCounts = {};
  completedExercises.forEach(id => {
    const catKey = id.split(":")[0];
    const title = getCategoryTitle(catKey);
    catCounts[title] = (catCounts[title] || 0) + 1;
  });
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  // Last completed routines (recent first)
  const recentRoutines = [...completedRoutines].reverse().slice(0, 5);

  // Format dates
  function fmtDate(dateStr) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric"
      });
    } catch { return null; }
  }

  function fmtDateTime(iso) {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      const date = d.toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric"
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true
      });
      return `${date} — ${time}`;
    } catch { return null; }
  }

  document.getElementById("pageTitle").textContent = "Ficha de Usuario";

  const content = document.getElementById("adminContent");

  // Activity items HTML
  const activityHtml = allItems.length > 0
    ? allItems.slice(0, 20).map(item => {
        const icon = item.type === "complete" ? "✅" : (item.type === "view" ? "👁" : "📝");
        return `
          <div class="user-detail-activity-item">
            <div class="user-detail-activity-icon">${icon}</div>
            <div class="user-detail-activity-content">
              <div class="user-detail-activity-desc">${item.label}</div>
              <div class="user-detail-activity-time">${fmtDateTime(item.at) || item.at}</div>
            </div>
          </div>
        `;
      }).join("")
    : "";

  content.innerHTML = `
    <button class="user-detail-back" id="userDetailBack">← Volver a Gestión de Usuarios</button>

    <!-- PROFILE CARD -->
    <div class="user-detail-card">
      <div class="user-detail-card-header">
        <div class="user-detail-avatar">
          ${avatar ? `<img src="${avatar}" alt="${name}">` : initial}
        </div>
        <div class="user-detail-title">
          <h2>${name}</h2>
          <div class="user-detail-role">
            <span class="user-row-badge ${roleClass}">${roleLabel}</span>
          </div>
        </div>
      </div>
      <div class="user-detail-fields">
        <div class="user-detail-field">
          <span class="user-detail-label">Correo electrónico</span>
          <span class="user-detail-value">${email || (isLocal ? "Sin correo — Perfil local" : "—")}</span>
        </div>
        <div class="user-detail-field">
          <span class="user-detail-label">Fecha de registro</span>
          <span class="user-detail-value">${user.registeredAt ? fmtDate(user.registeredAt) || user.registeredAt : (hasLocal ? "Disponible con backend" : "—")}</span>
        </div>
        <div class="user-detail-field">
          <span class="user-detail-label">Último acceso</span>
          <span class="user-detail-value">${user.lastActive ? fmtDateTime(user.lastActive) || user.lastActive : (hasLocal ? "Disponible con backend" : "—")}</span>
        </div>
        <div class="user-detail-field">
          <span class="user-detail-label">Tipo de cuenta</span>
          <span class="user-detail-value">${isLocal ? "Perfil local (este dispositivo)" : (hasActiveLink ? "Google / Firebase (vinculado)" : (user.source === "firebase" ? "Google / Firebase" : "—"))}</span>
        </div>
      </div>
    </div>

    <!-- METRICS -->
    <h3 class="user-detail-section-title">Actividad deportiva</h3>
    <div class="user-detail-metrics">
      <div class="user-detail-metric">
        <div class="user-detail-metric-value">${totalRoutines > 0 || hasLocal ? totalRoutines : "—"}</div>
        <div class="user-detail-metric-label">Rutinas completadas</div>
        ${totalRoutines === 0 && hasLocal ? '<div class="user-detail-metric-hint">Sin rutinas aún</div>' : ''}
      </div>
      <div class="user-detail-metric">
        <div class="user-detail-metric-value">${totalExercises > 0 || hasLocal ? totalExercises : "—"}</div>
        <div class="user-detail-metric-label">Ejercicios realizados</div>
        ${totalExercises === 0 && hasLocal ? '<div class="user-detail-metric-hint">Sin ejercicios aún</div>' : ''}
      </div>
      <div class="user-detail-metric">
        <div class="user-detail-metric-value">${totalMinutes > 0 ? timeStr : (hasLocal ? "0h 00m" : "—")}</div>
        <div class="user-detail-metric-label">Tiempo entrenado</div>
        ${totalMinutes === 0 && hasLocal ? '<div class="user-detail-metric-hint">Sin tiempo registrado</div>' : ''}
      </div>
      <div class="user-detail-metric">
        <div class="user-detail-metric-value ${!lastActivity && !hasLocal ? 'pending' : ''}">${lastActivity ? fmtDateTime(lastActivity)?.split("—")[0]?.trim() || "—" : (hasLocal ? "—" : "—")}</div>
        <div class="user-detail-metric-label">Última actividad</div>
        ${lastActivity ? '' : (hasLocal ? '<div class="user-detail-metric-hint">Sin actividad registrada</div>' : '<div class="user-detail-metric-hint">Disponible con backend PostgreSQL</div>')}
      </div>
    </div>

    <!-- CATEGORIES -->
    <h3 class="user-detail-section-title">Categorías más entrenadas</h3>
    ${sortedCats.length > 0
      ? `<div class="user-detail-card">
          <div class="user-detail-categories">
            ${sortedCats.map(([cat, count]) => `
              <div class="user-detail-category">
                ${cat} <span class="cat-count">${count}</span>
              </div>
            `).join("")}
          </div>
        </div>`
      : `<div class="user-detail-empty">
          <div class="user-detail-empty-icon">🏋️</div>
          <p>${hasLocal ? "Este usuario no ha realizado ejercicios aún." : "Las categorías más entrenadas estarán disponibles cuando el usuario registre actividad."}</p>
        </div>`
    }

    <!-- ROUTINE HISTORY -->
    ${recentRoutines.length > 0 ? `
      <h3 class="user-detail-section-title">Últimas rutinas completadas</h3>
      <div class="user-detail-card">
        <div class="user-detail-fields">
          ${recentRoutines.map(r => `
            <div class="user-detail-field">
              <span class="user-detail-value">${r.categoryTitle || r.categoryKey || "Rutina"}</span>
              <span style="margin-left:auto;font-size:0.8rem;color:var(--muted)">${fmtDateTime(r.completedAt) || r.completedAt}</span>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <!-- ACTIVITY HISTORY -->
    <h3 class="user-detail-section-title">Historial de actividad</h3>
    ${activityHtml
      ? `<div class="user-detail-activity-list">${activityHtml}</div>`
      : `<div class="user-detail-empty">
          <div class="user-detail-empty-icon">📭</div>
          <p>${hasLocal ? "Este usuario no ha registrado actividad aún." : "El historial de actividad estará disponible cuando DrillUp Sports esté conectado al backend PostgreSQL."}</p>
        </div>`
    }

    <!-- Backend note -->
    <p style="margin:24px 0 0;font-size:0.78rem;color:var(--muted);text-align:center;line-height:1.5">
      Datos provenientes de almacenamiento local.
      Con backend PostgreSQL, los datos se consultarán mediante
      <code>GET /api/admin/users/${uid}/activity</code>
      y <code>GET /api/admin/users/${uid}/stats</code>.
    </p>
  `;

  // Back button
  content.querySelector("#userDetailBack").addEventListener("click", renderUsers);

  // Update sidebar nav (keep "Usuarios" active)
  setActiveNav("users");
}

// ======================== SECTION: EXERCISES ========================
function renderExercises() {
  const exercises = getExercises();

  document.getElementById("pageTitle").textContent = "Ejercicios";

  const content = document.getElementById("adminContent");

  if (!exercises) {
    content.innerHTML = `
      <div class="users-placeholder">
        <div class="placeholder-icon">🏀</div>
        <h3>No hay ejercicios registrados</h3>
        <p>Los ejercicios se crean directamente en el código del proyecto.</p>
      </div>
    `;
    return;
  }

  const totalCount = Object.values(exercises).reduce((sum, cat) => sum + (cat.exercises ? cat.exercises.length : 0), 0);

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:16px">
      <span style="font-size:0.85rem;color:var(--muted)">${totalCount} ejercicios</span>
    </div>
    <div id="exercisesContainer">
      ${Object.entries(exercises).map(([key, cat]) => {
        const items = cat.exercises || [];
        const title = cat.title || key;
        return `
          <div class="category-group">
            <button class="category-header" data-toggle-category="${key}">
              <span>${title.toUpperCase()}</span>
              <span class="category-count">${items.length}</span>
              <span class="toggle-icon">▼</span>
            </button>
            <div class="category-body" data-category-body="${key}">
              ${items.map((ex, idx) => {
                const id = ex.id || (key + "-" + idx);
                return `
                  <div class="list-card">
                    <div class="card-info">
                      <div class="card-title">${ex.name}</div>
                      <div class="card-meta">
                        <span>${ex.summary || ""}</span>
                        <span>${ex.level ? statusBadge(normalizeLevel(ex.level)) : ""}</span>
                        <span>${ex.time || ""}</span>
                      </div>
                    </div>
                    <div class="card-actions">
                      <button class="btn btn-sm btn-ghost" data-edit-exercise="${id}">✏️</button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  content.querySelectorAll("[data-edit-exercise]").forEach(btn => {
    btn.addEventListener("click", () => showExerciseModal("edit", btn.dataset.editExercise));
  });

  content.querySelector("#exercisesContainer").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-category]");
    if (!btn) return;
    const key = btn.dataset.toggleCategory;
    const body = content.querySelector(`[data-category-body="${key}"]`);
    const icon = btn.querySelector(".toggle-icon");
    if (body) {
      body.classList.toggle("collapsed");
      icon.classList.toggle("expanded");
    }
  });
}

function showExerciseModal(_, id) {
  if (!id) return;
  const allExercises = getExercises();
  let found = null;
  let foundKey = null;
  for (const [key, cat] of Object.entries(allExercises)) {
    const items = cat.exercises || [];
    for (let i = 0; i < items.length; i++) {
      const itemId = items[i].id || (key + "-" + i);
      if (itemId === id) {
        found = items[i];
        foundKey = id;
        break;
      }
    }
    if (found) break;
  }
  if (!found) return;

  const overlay = showModal(
    "Editar ejercicio",
    `
      <div class="form-group">
        <label>Nombre del ejercicio</label>
        <input type="text" class="form-input" id="exName" value="${escapeHtml(found.name || "")}" placeholder="Ej: Pase de pecho">
      </div>
      <div class="form-group">
        <label>Resumen</label>
        <input type="text" class="form-input" id="exSummary" value="${escapeHtml(found.summary || "")}" placeholder="Breve descripción del ejercicio">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nivel</label>
          <select class="form-select" id="exLevel">
            <option value="Nivel básico">Principiante</option>
            <option value="Nivel intermedio">Intermedio</option>
            <option value="Nivel avanzado">Avanzado</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tiempo</label>
          <input type="text" class="form-input" id="exTime" value="${escapeHtml(found.time || "")}" placeholder="Ej: 45 segundos">
        </div>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea class="form-textarea" id="exDescription" placeholder="Descripción detallada del ejercicio">${escapeHtml(found.description || "")}</textarea>
      </div>
      <div class="form-group">
        <label>Objetivo / Ayuda</label>
        <textarea class="form-textarea" id="exHelp" placeholder="Finalidad del ejercicio">${escapeHtml(found.help || "")}</textarea>
      </div>
    `,
    `<button class="btn btn-primary" id="saveExerciseBtn">Guardar cambios</button><button class="btn btn-ghost" data-close-modal>Cancelar</button>`
  );

  overlay.querySelector("#exLevel").value = found.level || "Nivel básico";

  overlay.querySelector("#saveExerciseBtn").addEventListener("click", () => {
    const name = overlay.querySelector("#exName").value.trim();
    const summary = overlay.querySelector("#exSummary").value.trim();
    const level = overlay.querySelector("#exLevel").value;
    const time = overlay.querySelector("#exTime").value.trim();
    const description = overlay.querySelector("#exDescription").value.trim();
    const help = overlay.querySelector("#exHelp").value.trim();

    if (!name) {
      overlay.querySelector("#exName").focus();
      overlay.querySelector("#exName").style.borderColor = "#ef4444";
      return;
    }

    const admin = getAdminStore("exercises");
    admin.edited[foundKey] = { name, summary, level, time, description, help };
    saveAdminStore("exercises", admin);

    overlay.remove();
    renderExercises();
  });
}

// ======================== SECTION: SIGNALS ========================
function renderSignals() {
  const signals = getSignals();

  document.getElementById("pageTitle").textContent = "Señales Arbitrales";

  const content = document.getElementById("adminContent");

  if (!signals) {
    content.innerHTML = `
      <div class="users-placeholder">
        <div class="placeholder-icon">🚩</div>
        <h3>No hay señales registradas</h3>
        <p>Las señales arbitrales se crean directamente en el código del proyecto.</p>
      </div>
    `;
    return;
  }

  const groups = {};
  signals.forEach(s => {
    const cat = s.category || "Otras";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  });

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:16px">
      <span style="font-size:0.85rem;color:var(--muted)">${signals.length} señales</span>
    </div>
    <div id="signalsContainer">
      ${Object.entries(groups).map(([cat, items]) => {
        const key = cat.toLowerCase().replace(/\s+/g, "-");
        return `
          <div class="category-group">
            <button class="category-header" data-toggle-category="${key}">
              <span>${cat.toUpperCase()}</span>
              <span class="category-count">${items.length}</span>
              <span class="toggle-icon">▼</span>
            </button>
            <div class="category-body" data-category-body="${key}">
              ${items.map(s => `
                <div class="list-card">
                  <div class="card-info">
                    <div class="card-title">${s.title || s.name}</div>
                    <div class="card-meta">
                      <span style="color:var(--muted);font-size:0.78rem">${s.description || s.explanation || ""}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <button class="btn btn-sm btn-ghost" data-edit-signal="${s.id}">✏️</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  content.querySelectorAll("[data-edit-signal]").forEach(btn => {
    btn.addEventListener("click", () => showSignalModal("edit", btn.dataset.editSignal));
  });

  content.querySelector("#signalsContainer").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-category]");
    if (!btn) return;
    const key = btn.dataset.toggleCategory;
    const body = content.querySelector(`[data-category-body="${key}"]`);
    const icon = btn.querySelector(".toggle-icon");
    if (body) {
      body.classList.toggle("collapsed");
      icon.classList.toggle("expanded");
    }
  });
}

function showSignalModal(_, id) {
  if (!id) return;
  const signals = getSignals();
  const editData = signals.find(s => s.id === id);
  if (!editData) return;

  const overlay = showModal(
    "Editar señal",
    `
      <div class="form-group">
        <label>Nombre de la señal</label>
        <input type="text" class="form-input" id="sigName" value="${escapeHtml(editData.title || "")}" placeholder="Ej: Violación de pasos">
      </div>
      <div class="form-group">
        <label>Categoría</label>
        <select class="form-select" id="sigCategory">
          <option>Violaciones</option>
          <option>Faltas personales</option>
          <option>Faltas especiales</option>
          <option>Señales de puntuación</option>
          <option>Tiros libres</option>
          <option>Control del reloj</option>
          <option>Señales administrativas</option>
        </select>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea class="form-textarea" id="sigDesc" placeholder="Describe la señal...">${escapeHtml(editData.description || "")}</textarea>
      </div>
      <div class="form-group">
        <label>Interpretación</label>
        <textarea class="form-textarea" id="sigInterpretation" placeholder="Interpretación de la señal...">${escapeHtml(editData.interpretation || "")}</textarea>
      </div>
      <div class="form-group">
        <label>Explicación</label>
        <textarea class="form-textarea" id="sigExplanation" placeholder="Explicación de la señal...">${escapeHtml(editData.explanation || "")}</textarea>
      </div>
      <div class="form-group">
        <label>Regla</label>
        <textarea class="form-textarea" id="sigRule" placeholder="Regla asociada...">${escapeHtml(editData.rule || "")}</textarea>
      </div>
    `,
    `<button class="btn btn-primary" id="saveSignalBtn">Guardar cambios</button><button class="btn btn-ghost" data-close-modal>Cancelar</button>`
  );

  overlay.querySelector("#sigCategory").value = editData.category || "Violaciones";

  overlay.querySelector("#saveSignalBtn").addEventListener("click", () => {
    const name = overlay.querySelector("#sigName").value.trim();
    const category = overlay.querySelector("#sigCategory").value;
    const description = overlay.querySelector("#sigDesc").value.trim();
    const interpretation = overlay.querySelector("#sigInterpretation").value.trim();
    const explanation = overlay.querySelector("#sigExplanation").value.trim();
    const rule = overlay.querySelector("#sigRule").value.trim();

    if (!name) {
      overlay.querySelector("#sigName").focus();
      overlay.querySelector("#sigName").style.borderColor = "#ef4444";
      return;
    }

    const admin = getAdminStore("signals");

    if (id.startsWith("custom-")) {
      const idx = admin.custom.findIndex(c => c.id === id);
      if (idx !== -1) {
        admin.custom[idx] = { ...admin.custom[idx], title: name, category, description, interpretation, explanation, rule };
      }
    } else {
      admin.edited[id] = { title: name, category, description, interpretation, explanation, rule };
    }

    saveAdminStore("signals", admin);
    overlay.remove();
    renderSignals();
  });
}

// ======================== SECTION: PLAYS ========================
function renderPlays() {
  const plays = getPlays();

  document.getElementById("pageTitle").textContent = "Jugadas";

  const content = document.getElementById("adminContent");

  if (!plays) {
    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <button class="btn btn-primary" id="addPlay">➕ Crear jugada</button>
      </div>
      <div class="users-placeholder">
        <div class="placeholder-icon">📋</div>
        <h3>No hay jugadas registradas</h3>
        <p>Crea la primera jugada para comenzar a construir tu biblioteca de estrategias.</p>
      </div>
    `;
    content.querySelector("#addPlay")?.addEventListener("click", () => showPlayModal());
    return;
  }

  const groups = { ofensiva: [], defensiva: [] };
  plays.forEach(p => {
    const t = (p.type || "ofensiva").toLowerCase();
    if (t === "defensiva" || t === "defensive") {
      groups.defensiva.push(p);
    } else {
      groups.ofensiva.push(p);
    }
  });

  const groupLabels = { ofensiva: "Ofensivas", defensiva: "Defensivas" };

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:16px">
      <span style="font-size:0.85rem;color:var(--muted)">${plays.length} jugadas</span>
    </div>
    <div id="playsContainer">
      ${Object.entries(groups).filter(([_, items]) => items.length > 0).map(([key, items]) => `
        <div class="category-group">
          <button class="category-header" data-toggle-category="${key}">
            <span>${groupLabels[key] || key.toUpperCase()}</span>
            <span class="category-count">${items.length}</span>
            <span class="toggle-icon">▼</span>
          </button>
          <div class="category-body" data-category-body="${key}">
            ${items.map(p => `
              <div class="list-card">
                <div class="card-info">
                  <div class="card-title">${p.title}</div>
                  ${p.subtitle ? `<div class="card-meta"><span style="color:var(--muted);font-size:0.78rem">${p.subtitle}</span></div>` : ""}
                </div>
                <div class="card-actions">
                  <button class="btn btn-sm btn-ghost" data-edit-play="${p.id}">✏️</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
      ${Object.values(groups).every(arr => arr.length === 0) ? `
        <div class="users-placeholder">
          <div class="placeholder-icon">📋</div>
          <h3>No hay jugadas registradas</h3>
          <p>Las jugadas se crean directamente en el código del proyecto.</p>
        </div>
      ` : ""}
    </div>
  `;

  content.querySelectorAll("[data-edit-play]").forEach(btn => {
    btn.addEventListener("click", () => showPlayModal("edit", btn.dataset.editPlay));
  });

  content.querySelector("#playsContainer").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-category]");
    if (!btn) return;
    const key = btn.dataset.toggleCategory;
    const body = content.querySelector(`[data-category-body="${key}"]`);
    const icon = btn.querySelector(".toggle-icon");
    if (body) {
      body.classList.toggle("collapsed");
      icon.classList.toggle("expanded");
    }
  });
}

function showPlayModal(_, id) {
  if (!id) return;
  const plays = getPlays();
  const editData = plays.find(p => p.id === id);
  if (!editData) return;

  const overlay = showModal(
    "Editar jugada",
    `
      <div class="form-group">
        <label>Nombre de la jugada</label>
        <input type="text" class="form-input" id="playName" value="${escapeHtml(editData.title || "")}" placeholder="Ej: Pick and Roll">
      </div>
      <div class="form-group">
        <label>Tipo</label>
        <select class="form-select" id="playType">
          <option value="ofensiva">Ofensiva</option>
          <option value="defensiva">Defensiva</option>
        </select>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea class="form-textarea" id="playDesc" placeholder="Describe la jugada...">${escapeHtml(editData.subtitle || "")}</textarea>
      </div>
    `,
    `<button class="btn btn-primary" id="savePlayBtn">Guardar cambios</button><button class="btn btn-ghost" data-close-modal>Cancelar</button>`
  );

  overlay.querySelector("#playType").value = editData.type || "ofensiva";

  overlay.querySelector("#savePlayBtn").addEventListener("click", () => {
    const name = overlay.querySelector("#playName").value.trim();
    const type = overlay.querySelector("#playType").value;
    const subtitle = overlay.querySelector("#playDesc").value.trim();

    if (!name) {
      overlay.querySelector("#playName").focus();
      overlay.querySelector("#playName").style.borderColor = "#ef4444";
      return;
    }

    const admin = getAdminStore("plays");

    if (id.startsWith("custom-")) {
      const idx = admin.custom.findIndex(c => c.id === id);
      if (idx !== -1) {
        admin.custom[idx] = { ...admin.custom[idx], title: name, type, subtitle };
      }
    } else {
      admin.edited[id] = { title: name, type, subtitle };
    }

    saveAdminStore("plays", admin);
    overlay.remove();
    renderPlays();
  });
}

// ======================== SECTION: STATISTICS ========================
function renderStats() {
  document.getElementById("pageTitle").textContent = "Estadísticas";
  const content = document.getElementById("adminContent");

  // Destroy previous chart instances
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  Object.keys(chartInstances).forEach(k => delete chartInstances[k]);

  Chart.defaults.color = "#94a3b8";
  Chart.defaults.borderColor = "rgba(148, 163, 184, 0.12)";
  Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";

  content.innerHTML = `
    <p style="color:var(--muted);margin:0 0 24px">
      Las estadísticas se generarán automáticamente a medida que los usuarios utilicen la plataforma.
      Cuando DrillUp Sports esté conectado al backend PostgreSQL, los datos se consultarán mediante APIs REST.
    </p>

    <div class="charts-grid">
      <!-- 1. Usuarios registrados por mes | Bar -->
      <div class="chart-card full-width" data-chart="registrations">
        <h3>Usuarios registrados por mes</h3>
        <div class="chart-container">
          <canvas id="chartRegistrations"></canvas>
          <div class="chart-empty-state">
            <div class="chart-icon">📊</div>
            <p>Esperando datos de registro. Aparecerán cuando los usuarios se registren en la plataforma.</p>
          </div>
        </div>
      </div>

      <!-- 2. Usuarios activos por mes | Line -->
      <div class="chart-card" data-chart="activeUsers">
        <h3>Usuarios activos por mes</h3>
        <div class="chart-container">
          <canvas id="chartActiveUsers"></canvas>
          <div class="chart-empty-state">
            <div class="chart-icon">📈</div>
            <p>Esperando datos de actividad. Reflejará la tendencia de usuarios que entrenan cada mes.</p>
          </div>
        </div>
      </div>

      <!-- 3. Ejercicios completados por mes | Bar -->
      <div class="chart-card" data-chart="completedExercises">
        <h3>Ejercicios completados por mes</h3>
        <div class="chart-container">
          <canvas id="chartCompletedExercises"></canvas>
          <div class="chart-empty-state">
            <div class="chart-icon">🏀</div>
            <p>Esperando datos de ejercicios. Mostrará el volumen de entrenamiento completado por los usuarios.</p>
          </div>
        </div>
      </div>

      <!-- 4. Actividad semanal (horas) | Line -->
      <div class="chart-card" data-chart="weeklyActivity">
        <h3>Actividad semanal (horas)</h3>
        <div class="chart-container">
          <canvas id="chartWeeklyActivity"></canvas>
          <div class="chart-empty-state">
            <div class="chart-icon">⏱</div>
            <p>Esperando datos de tiempo. Mostrará las horas acumuladas de entrenamiento de Lun a Dom.</p>
          </div>
        </div>
      </div>

      <!-- 5. Categorías más entrenadas | Doughnut -->
      <div class="chart-card" data-chart="categories">
        <h3>Categorías más entrenadas</h3>
        <div class="chart-container">
          <canvas id="chartCategories"></canvas>
          <div class="chart-empty-state">
            <div class="chart-icon">🎯</div>
            <p>Esperando datos de categorías. Identificará qué habilidades entrenan más los usuarios.</p>
          </div>
        </div>
      </div>

      <!-- 6. Top ejercicios más realizados | Horizontal Bar -->
      <div class="chart-card" data-chart="topExercises">
        <h3>Top ejercicios más realizados</h3>
        <div class="chart-container">
          <canvas id="chartTopExercises"></canvas>
          <div class="chart-empty-state">
            <div class="chart-icon">🏆</div>
            <p>Esperando datos de ejercicios. Listará los ejercicios con mayor frecuencia de uso.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Architecture note -->
    <p style="margin:24px 0 0;font-size:0.78rem;color:var(--muted);text-align:center;line-height:1.5">
      Endpoints previstos:
      <code>GET /api/admin/stats/registrations</code>,
      <code>GET /api/admin/stats/active-users</code>,
      <code>GET /api/admin/stats/completed-exercises</code>,
      <code>GET /api/admin/stats/weekly-activity</code>,
      <code>GET /api/admin/stats/categories</code>,
      <code>GET /api/admin/stats/top-exercises</code>
    </p>
  `;

  // ── Initialize Chart.js instances (empty, ready for data) ──

  const palette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  function createChart(id, type, extraOpts) {
    const el = document.getElementById(id);
    if (!el) return null;
    const isDoughnut = type === "doughnut";
    const isHoriz = extraOpts?.indexAxis === "y";
    try {
      return new Chart(el, {
        type,
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: isDoughnut ? palette : (type === "line" ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.55)"),
            borderColor: isDoughnut ? "#1e293b" : "rgba(59, 130, 246, 0.9)",
            borderWidth: isDoughnut ? 2 : 2,
            fill: type === "line",
            tension: type === "line" ? 0.3 : undefined,
            pointRadius: type === "line" ? 3 : undefined,
            borderRadius: isDoughnut ? 0 : 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: isDoughnut ? "60%" : undefined,
          indexAxis: isHoriz ? "y" : undefined,
          scales: isDoughnut ? undefined : (isHoriz ? {
            x: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.08)" } },
            y: { grid: { display: false } }
          } : {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.08)" } }
          }),
          plugins: {
            legend: isDoughnut
              ? { position: "right", labels: { color: "#94a3b8", padding: 12, usePointStyle: true, pointStyle: "circle" } }
              : { display: false },
            tooltip: {
              backgroundColor: "#1e293b",
              titleColor: "#f1f5f9",
              bodyColor: "#94a3b8",
              borderColor: "rgba(148, 163, 184, 0.2)",
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
            }
          },
          ...extraOpts
        }
      });
    } catch { return null; }
  }

  chartInstances.registrations = createChart("chartRegistrations", "bar");
  chartInstances.activeUsers = createChart("chartActiveUsers", "line");
  chartInstances.completedExercises = createChart("chartCompletedExercises", "bar");
  chartInstances.weeklyActivity = createChart("chartWeeklyActivity", "line");
  chartInstances.categories = createChart("chartCategories", "doughnut");
  chartInstances.topExercises = createChart("chartTopExercises", "bar", { indexAxis: "y" });
}

/**
 * feedStatChart(name, labels, data[, datasetLabel])
 *
 * Populates a chart with real data and hides its empty-state overlay.
 *
 * @param {string} name        - Chart key (registrations, activeUsers, etc.)
 * @param {string[]} labels    - Labels for the axis/legend
 * @param {number[]} data      - Numeric data values
 * @param {string}  [label]    - Optional dataset label for tooltips
 *
 * @example
 *   feedStatChart("registrations", ["Ene","Feb","Mar"], [12,18,25]);
 *   feedStatChart("categories", ["Dribbling","Tiro"], [47, 32], "Ejercicios");
 */
function feedStatChart(name, labels, data, datasetLabel) {
  const chart = chartInstances[name];
  if (!chart) { console.warn("Chart not found:", name); return; }
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  if (datasetLabel) chart.data.datasets[0].label = datasetLabel;
  chart.update();
  const card = document.querySelector(`[data-chart="${name}"]`);
  if (card) {
    const empty = card.querySelector(".chart-empty-state");
    if (empty) empty.style.display = "none";
  }
}

// ======================== SECTION: SISTEMA ========================
/*
 * Version scheme:
 *   0.x.x  — Desarrollo activo. Funcionalidades en progreso, sin versión pública estable.
 *   1.x.x  — Primera versión estable para producción.
 *   2.x.x  — Cambios importantes de arquitectura o nuevas generaciones de la plataforma.
 */

const PLATFORM_VERSION = "0.9.0";

function renderSettings() {
  document.getElementById("pageTitle").textContent = "Sistema";

  const session = getSession();
  const email = session?.email || "";
  const name = session?.nombre || "";

  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <div class="settings-grid">

      <!-- INFO -->
      <div class="settings-card">
        <h3>Información de la plataforma</h3>
        <p class="setting-desc">Datos generales de DrillUp Sports</p>
        <div class="settings-field">
          <span class="field-label">Nombre</span>
          <span class="field-value">DrillUp Sports</span>
        </div>
        <div class="settings-field">
          <span class="field-label">Versión</span>
          <span class="field-value">${PLATFORM_VERSION}</span>
        </div>
        <div class="settings-field">
          <span class="field-label">Tu rol</span>
          <span class="field-badge">Administrador</span>
        </div>
        <div class="settings-field">
          <span class="field-label">Tu cuenta</span>
          <span class="field-value">${name} · ${email}</span>
        </div>
      </div>

      <!-- SERVICES -->
      <!--
        Status system — ready for backend:
        Replace the hardcoded status below with data from:
          GET /api/admin/system/services
        Expected response shape per service:
          { name, status: "active" | "inactive" | "error" | "maintenance", detail? }
        Usage example:
          const services = await fetch("/api/admin/system/services").then(r => r.json());
          services.forEach(s => updateServiceStatus(s.name, s.status, s.detail));
      -->
      <div class="settings-card">
        <h3>Servicios</h3>
        <p class="setting-desc">Estado de los servicios activos en la plataforma</p>
        <div class="settings-service" data-service="auth">
          <span class="field-label">Autenticación</span>
          <span class="service-status service-active" data-status="active">✓ Activa</span>
        </div>
        <div class="settings-service" data-service="database">
          <span class="field-label">Base de datos</span>
          <span class="service-status service-inactive" data-status="inactive">— En implementación</span>
        </div>
        <div class="settings-service" data-service="storage">
          <span class="field-label">Almacenamiento de video</span>
          <span class="service-status service-inactive" data-status="inactive">— En implementación</span>
        </div>
        <div class="settings-service" data-service="ai">
          <span class="field-label">Análisis por IA</span>
          <span class="service-status service-inactive" data-status="inactive">— En implementación</span>
        </div>
      </div>
    </div>
  `;
}

// ======================== NAVIGATION ========================
function setActiveNav(section) {
  document.querySelectorAll(".sidebar-nav a").forEach(a => {
    a.classList.toggle("active", a.dataset.section === section);
  });
}

function navigate(section) {
  if (section !== "stats") {
    Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
    Object.keys(chartInstances).forEach(k => delete chartInstances[k]);
  }

  currentSection = section;
  setActiveNav(section);
  searchQuery = "";
  statusFilter = "";
  currentPage = 1;
  window.scrollTo({ top: 0, behavior: "smooth" });

  const renderers = {
    resume: renderResume,
    users: renderUsers,
    exercises: renderExercises,
    signals: renderSignals,
    plays: renderPlays,
    stats: renderStats,
    settings: renderSettings,
  };

  (renderers[section] || renderResume)();
}

// ======================== LOGOUT MODAL ========================
function showLogoutModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px";

  const card = document.createElement("div");
  card.className = "logout-card";
  card.style.cssText = "background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:36px 40px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5)";

  card.innerHTML = `
    <h2 style="margin:0 0 10px;font-size:1.15rem;font-weight:600;color:var(--text)">¿Seguro que quieres cerrar sesión?</h2>
    <p style="margin:0 0 28px;color:var(--muted);font-size:0.9rem">Se cerrará tu sesión y volverás a la pantalla de acceso.</p>
    <div style="display:flex;gap:12px;justify-content:center">
      <button class="btn btn-danger" id="confirmLogoutModal">Cerrar sesión</button>
      <button class="btn btn-ghost" id="cancelLogoutModal" data-close-modal>Cancelar</button>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  overlay.querySelector("#confirmLogoutModal").addEventListener("click", () => {
    overlay.remove();
    logout();
  });

  overlay.querySelector("#cancelLogoutModal").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ======================== INIT ========================
async function initAdmin() {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      const sess = getSession();
      if (!sess || sess.rol !== "admin") {
        window.location.href = "login.html";
        return;
      }
    }
  });

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

  const session = getSession();
  const email = session?.email || "(sin sesión)";
  const rol = session?.rol || "none";
  const isAdmin = rol === "admin";

  protectPage(["admin"]);
  if (!session || session.rol !== "admin") return;

  // Set sidebar user info
  const profileKey = USER_PROFILE_BASE + "-" + session.uid;
  let profile = {};
  try {
    const raw = localStorage.getItem(profileKey);
    if (raw) profile = JSON.parse(raw);
  } catch {}

  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || session.nombre;

  const avatarEl = document.getElementById("sidebarAvatar");
  const avatarUrl = profile.avatar || profile.photo || session.foto || "";
  if (avatarUrl) {
    avatarEl.innerHTML = "";
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = "Foto de perfil";
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent = (firstName ? firstName[0] : session.nombre.charAt(0)).toUpperCase();
  }

  document.getElementById("sidebarName").textContent = fullName;

  // Clock
  function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true
    });
    document.getElementById("headerTime").innerHTML = `${dateStr}<br>${timeStr}`;
  }
  updateClock();
  setInterval(updateClock, 30000);

  // Brand link → Resume
  document.querySelector(".sidebar-brand").addEventListener("click", (e) => {
    e.preventDefault();
    navigate("resume");
  });

  // Logout
  document.getElementById("sidebarLogout").addEventListener("click", () => {
    showLogoutModal();
  });

  // Navigation
  document.querySelectorAll(".sidebar-nav a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(a.dataset.section);
    });
  });

  // Initial render
  navigate("resume");

  // Show page
  document.body.style.display = "";
}

initAdmin().catch(e => console.error("Admin init failed", e));
