(function () {
  if (isLoggedIn()) {
    redirectAfterLogin();
    return;
  }

  const authScreen = document.getElementById("authScreen");
  const guestScreen = document.getElementById("guestScreen");
  const googleBtn = document.getElementById("googleLogin");
  const guestEntryBtn = document.getElementById("guestEntryBtn");
  const guestBackBtn = document.getElementById("guestBackBtn");
  const guestGrid = document.getElementById("guestGrid");
  const guestNewForm = document.getElementById("guestNewForm");
  const guestNameField = document.getElementById("guestNameField");
  const createGuestBtn = document.getElementById("createGuestBtn");
  const guestError = document.getElementById("guestError");
  const guestSubtitle = document.getElementById("guestScreenSubtitle");
  const loginError = document.getElementById("loginError");

  function hideLoginError() { loginError.hidden = true; }
  function hideGuestError() { guestError.hidden = true; }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.hidden = false;
  }

  function showGuestError(msg) {
    guestError.textContent = msg;
    guestError.hidden = false;
  }

  function setLoading(btn, loading, text) {
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="spinner"></span>${text}` : text;
  }

  function showToast(msg) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 2700);
  }

  function redirectAfterLogin() {
    window.location.href = "index.html#usuario";
  }

  function deleteGuest(id) {
    const index = getGuestIndex();
    const g = index.find(x => x.id === id);
    if (!g) return;

    const overlay = document.createElement("div");
    overlay.className = "auth-modal";
    overlay.innerHTML = `
      <div class="auth-modal-card" style="text-align:left">
        <h3>¿Eliminar el perfil "${g.name}"?</h3>
        <p style="margin:0;color:var(--muted);font-size:0.9rem;line-height:1.5">
          Esta acción eliminará permanentemente:
        </p>
        <ul style="margin:12px 0 16px;padding:0 0 0 20px;color:var(--muted);font-size:0.88rem;line-height:1.8">
          <li>Perfil y datos personales</li>
          <li>Avatar</li>
          <li>Actividad y estadísticas</li>
          <li>Ejercicios completados</li>
          <li>Rutinas</li>
          <li>Videos subidos</li>
          <li>Métricas y progreso</li>
        </ul>
        <p style="margin:0 0 20px;color:#e74c3c;font-size:0.9rem;font-weight:600">Esta acción no se puede deshacer.</p>
        <div style="display:flex;gap:10px">
          <button class="auth-btn" id="cancelDeleteBtn" type="button" style="background:var(--line);color:var(--text);width:auto;padding:10px 24px">Cancelar</button>
          <button class="auth-btn" id="confirmDeleteBtn" type="button" style="background:#c0392b;width:auto;padding:10px 24px">Eliminar definitivamente</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function removeGuestData() {
      const fresh = getGuestIndex();
      const entry = fresh.find(x => x.id === id);
      if (!entry) return;
      const updated = fresh.filter(x => x.id !== id);
      saveGuestIndex(updated);

      const dataKeys = [
        `${USER_PROFILE_BASE}-${id}`,
        `${ACTIVITY_BASE}-${id}`,
        `${COMPLETED_EXERCISES_BASE}-${id}`,
        `drillup-sports-carry-${id}`
      ];
      dataKeys.forEach(key => {
        try { localStorage.removeItem(key); } catch {}
      });

      try { indexedDB.deleteDatabase(`drillup-sports-videos-${id}`); } catch {}

      const sessionUid = localStorage.getItem("uid");
      if (sessionUid === id) {
        clearSession();
        window.location.href = "login.html";
        return;
      }

      showToast(`✓ Perfil "${entry.name}" eliminado correctamente.`);
      renderGuestGrid();
    }

    overlay.querySelector("#cancelDeleteBtn").addEventListener("click", () => { overlay.remove(); });
    overlay.querySelector("#confirmDeleteBtn").addEventListener("click", () => { overlay.remove(); removeGuestData(); });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function renderGuestGrid() {
    const index = getGuestIndex().filter(g => !g.migrated);
    guestGrid.innerHTML = "";

    if (!index.length) {
      guestNewForm.hidden = false;
      guestSubtitle.textContent = "Crea tu perfil para empezar";
      return;
    }

    guestSubtitle.textContent = "Selecciona uno existente o crea uno nuevo";

    index.forEach((g) => {
      const profile = readJson(`${USER_PROFILE_BASE}-${g.id}`, {});
      const initial = (g.name ? g.name[0] : "?").toUpperCase();
      const avatarHtml = profile.avatar
        ? `<img src="${profile.avatar}" alt="${g.name}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
        : initial;
      const exerciseCount = readJson(`${COMPLETED_EXERCISES_BASE}-${g.id}`, []).length;
      const card = document.createElement("button");
      card.className = "guest-card";
      card.type = "button";
      card.innerHTML = `
        <span class="guest-avatar">${avatarHtml}</span>
        <span class="guest-delete" aria-label="Eliminar perfil">×</span>
        <strong>${g.name}</strong>
        <small>${exerciseCount} ejercicios</small>`;
      card.addEventListener("click", (e) => {
        if (e.target.closest(".guest-delete")) {
          deleteGuest(g.id);
          return;
        }
        selectGuest(g.id);
      });
      guestGrid.appendChild(card);
    });

    const addCard = document.createElement("button");
    addCard.className = "guest-card add-card";
    addCard.type = "button";
    addCard.innerHTML = `
      <span class="guest-avatar">+</span>
      <strong>Nuevo</strong>
      <small></small>`;
    addCard.addEventListener("click", () => {
      guestNewForm.hidden = false;
      guestNameField.focus();
      addCard.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    guestGrid.appendChild(addCard);
  }

  function selectGuest(id) {
    const index = getGuestIndex();
    const guest = index.find(g => g.id === id);
    if (!guest) return;
    guest.lastActive = new Date().toISOString();
    saveGuestIndex(index);
    createGuestSession(guest.id, guest.name);
    const existingProfile = readJson(userKey(USER_PROFILE_BASE), {});
    writeJson(userKey(USER_PROFILE_BASE), { ...existingProfile, firstName: guest.name });
    redirectAfterLogin();
  }

  function createNewGuest() {
    hideGuestError();
    const name = guestNameField.value.trim();
    if (!name) {
      showGuestError("Ingresa un nombre.");
      guestNameField.focus();
      return;
    }

    const index = getGuestIndex();
    const lowerNames = new Set(index.map(g => g.name.toLowerCase()));
    if (lowerNames.has(name.toLowerCase())) {
      const suggestion = suggestGuestName(name);
      showGuestError(`Ya existe un perfil con el nombre "${name}". Prueba: ${suggestion}`);
      guestNameField.focus();
      return;
    }

    const id = generateGuestId();
    index.push({
      id,
      name,
      created: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      migrated: false,
      pgUserId: null
    });
    saveGuestIndex(index);
    createGuestSession(id, name);
    const existingProfile = readJson(userKey(USER_PROFILE_BASE), {});
    writeJson(userKey(USER_PROFILE_BASE), { ...existingProfile, firstName: name });
    redirectAfterLogin();
  }

  function showGuestFlow() {
    hideGuestError();
    renderGuestGrid();
    guestNameField.value = "";
    authScreen.hidden = true;
    guestScreen.hidden = false;
    guestScreen.removeAttribute("hidden");
  }

  function showAuthScreen() {
    hideLoginError();
    authScreen.hidden = false;
    authScreen.removeAttribute("hidden");
    guestScreen.hidden = true;
  }

  // --- Google Sign-In ---
  googleBtn.addEventListener("click", async () => {
    hideLoginError();
    setLoading(googleBtn, true, "Ingresando...");

    let user;
    try {
      user = await loginWithGoogle();
    } catch (err) {
      if (err.message !== "Cerraste la ventana de Google antes de completar el inicio.") {
        showLoginError(err.message);
      }
      setLoading(googleBtn, false, "Continuar con Google");
      return;
    }

    // Session is saved by onAuthStateChanged in auth.js
    await new Promise(r => setTimeout(r, 200));
    setLoading(googleBtn, false, "Continuar con Google");
    redirectAfterLogin();
  });

  // --- Guest entry ---
  guestEntryBtn.addEventListener("click", showGuestFlow);
  guestBackBtn.addEventListener("click", showAuthScreen);

  guestNameField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createGuestBtn.click();
    }
  });

  createGuestBtn.addEventListener("click", createNewGuest);
})();
