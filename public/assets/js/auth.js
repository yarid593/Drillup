const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCT9ROrzb8eC5YArdpzAJN4tA7zAOW_vzc",
  authDomain: "drill-sports.firebaseapp.com",
  projectId: "drill-sports",
  storageBucket: "drill-sports.firebasestorage.app",
  messagingSenderId: "798522274055",
  appId: "1:798522274055:web:9ab2f503bcbab6af1255a2"
};

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();

const GUEST_PREFIX = "guest_";
const GUEST_INDEX_KEY = "drillup-guest:index";
const USER_PROFILE_BASE = "drillup-sports-profile";
const ACTIVITY_BASE = "drillup-sports-activity";
const COMPLETED_EXERCISES_BASE = "drillup-sports-completed-exercises";
const COMPLETED_ROUTINES_BASE = "drillup-sports-completed-routines";

function readJson(key, fallback) {
  if (!key) return fallback;
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch { return fallback; }
}

function writeJson(key, value) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function userKey(base) {
  const uid = localStorage.getItem("uid");
  return uid ? `${base}-${uid}` : null;
}

function isGuest() {
  return localStorage.getItem("uid")?.startsWith(GUEST_PREFIX) || false;
}

function createGuestSession(guestId, name) {
  localStorage.setItem("uid", guestId);
  localStorage.setItem("usuario", "");
  localStorage.setItem("nombre", name);
  localStorage.setItem("foto", "");
  localStorage.setItem("rol", "guest");
}

function getGuestIndex() {
  try {
    const raw = localStorage.getItem(GUEST_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveGuestIndex(index) {
  try {
    localStorage.setItem(GUEST_INDEX_KEY, JSON.stringify(index));
  } catch {}
}

function generateGuestId() {
  const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return GUEST_PREFIX + uuid;
}

function suggestGuestName(baseName) {
  const index = getGuestIndex();
  const lowerNames = new Set(index.map(g => g.name.toLowerCase()));
  if (!lowerNames.has(baseName.toLowerCase())) return baseName;
  let counter = 2;
  while (lowerNames.has(`${baseName}${String(counter).padStart(2, '0')}`.toLowerCase())) {
    counter++;
  }
  return `${baseName}${String(counter).padStart(2, '0')}`;
}

auth.onAuthStateChanged((user) => {
  if (user) {
    if (!isGuest()) {
      saveSession(user);
      syncProfileWithFirebase(user);
    }
  } else if (!isGuest()) {
    clearSession();
  }
  window.dispatchEvent(new CustomEvent("auth-ready", { detail: { user } }));
});

const ADMIN_EMAILS = ["vegalizcano160@gmail.com", "admin@drillsports.com"];

function saveSession(user) {
  localStorage.setItem("uid", user.uid);
  localStorage.setItem("usuario", user.email || "");
  const name = user.displayName || user.email?.split("@")[0] || "Usuario";
  localStorage.setItem("nombre", name);
  const googleProvider = user.providerData?.find((p) => p.providerId === "google.com");
  const foto = user.photoURL || googleProvider?.photoURL || "";
  localStorage.setItem("foto", foto);
  const rol = ADMIN_EMAILS.includes(user.email?.toLowerCase()) ? "admin" : "user";
  localStorage.setItem("rol", rol);
}

function clearSession() {
  const uid = localStorage.getItem("uid");
  localStorage.removeItem("uid");
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  localStorage.removeItem("nombre");
  localStorage.removeItem("foto");
  if (uid) {
    localStorage.removeItem("drillup-sports-carry-" + uid);
  }
}

function syncProfileWithFirebase(user) {
  try {
    const key = userKey(USER_PROFILE_BASE);
    if (!key) return;
    let profile = {};
    const raw = localStorage.getItem(key);
    if (raw) {
      profile = JSON.parse(raw);
    }
    if (user.displayName && !profile.firstName && !profile.lastName) {
      const parts = user.displayName.trim().split(/\s+/);
      profile.firstName = parts[0];
      profile.lastName = parts.slice(1).join(" ");
    }
    if (user.email && !profile.email) profile.email = user.email;
    if (!profile.avatar) {
      const googleProvider = user.providerData?.find((p) => p.providerId === "google.com");
      const photoUrl = user.photoURL || googleProvider?.photoURL;
      if (photoUrl) profile.avatar = photoUrl;
    }
    localStorage.setItem(key, JSON.stringify(profile));
  } catch {}
}

function getSession() {

    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        return null;
    }

    try {

        const parsed = JSON.parse(user);

        return {
            uid: parsed.id,
            email: parsed.email,
            nombre: parsed.name,
            foto: parsed.photo_url || "",
            rol: parsed.role
        };

    } catch {

        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        return null;

    }

}

function isLoggedIn() {
  return getSession() !== null;
}

async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(email);
  } catch (err) {
    throw normalizeFirebaseError(err);
  }
}

async function loginUser(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  } catch (err) {
    throw normalizeFirebaseError(err);
  }
}

async function loginWithGoogle() {

   const provider = new firebase.auth.GoogleAuthProvider();

provider.setCustomParameters({
    prompt: "select_account"
});

    try {

        const cred = await auth.signInWithPopup(provider);

        const idToken = await cred.user.getIdToken(true);

        const response = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                idToken
            })
        });

        if (!response.ok) {

            console.error("STATUS:", response.status);

            const error = await response.text();

            console.error(error);

            throw new Error("No fue posible autenticar con Laravel");

        }

        const data = await response.json();
        console.log(data);

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log(localStorage.getItem("auth_token"));
        console.log(localStorage.getItem("user"));

        return data.user;

    } catch (err) {

        console.error(err);

        throw normalizeFirebaseError(err);

    }

}

async function registerUser(email, password, displayName) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      await cred.user.updateProfile({ displayName });
    }
    saveSession(cred.user);
    return cred.user;
  } catch (err) {
    throw normalizeFirebaseError(err);
  }
}

function hasGoogleLinked() {
  try {
    return auth.currentUser?.providerData?.some((p) => p.providerId === "google.com") || false;
  } catch { return false; }
}

async function linkGoogleAccount() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const cred = await auth.currentUser.linkWithPopup(provider);
    // photoURL desde el provider de Google, no de user.photoURL (que es null al vincular)
    const googleData = cred.user.providerData.find((p) => p.providerId === "google.com");
    if (googleData?.photoURL) {
      const key = userKey(USER_PROFILE_BASE);
      const raw = localStorage.getItem(key);
      if (raw) {
        const profile = JSON.parse(raw);
        if (!profile.avatar) profile.avatar = googleData.photoURL;
        localStorage.setItem(key, JSON.stringify(profile));
      }
    }
    return cred.user;
  } catch (err) {
    if (err.code === "auth/credential-already-in-use") {
      throw new Error("Esta cuenta de Google ya está vinculada a otro usuario.");
    }
    throw normalizeFirebaseError(err);
  }
}

function checkGuestIntegrity() {
  const index = getGuestIndex();
  const seen = {};
  let hasConflict = false;
  index.forEach(g => {
    if (g.pgUserId) {
      if (seen[g.pgUserId]) {
        console.warn(
          `⚠️ Conflicto: "${seen[g.pgUserId].name}" (${seen[g.pgUserId].id}) y "${g.name}" (${g.id}) ` +
          `comparten el mismo pgUserId: ${g.pgUserId}`
        );
        hasConflict = true;
      } else {
        seen[g.pgUserId] = g;
      }
    }
  });
  return hasConflict;
}

function diagnoseMigrations() {
  console.log("%c=== Diagnóstico de Migraciones Guest → Google ===", "font-size:1.2em;font-weight:bold");
  const index = getGuestIndex();
  console.log(`\nTotal perfiles en guest:index: ${index.length}`);
  console.log("──────────────────────────────────────────");

  index.forEach(g => {
    console.log(`Perfil: "${g.name}"`);
    console.log(`  id: ${g.id}`);
    console.log(`  migrated: ${g.migrated}`);
    console.log(`  pgUserId: ${g.pgUserId || "(ninguno)"}`);
    console.log(`  creado: ${g.created}`);
    console.log(`  último acceso: ${g.lastActive}`);

    if (g.pgUserId) {
      const firebaseProfile = readJson(`${USER_PROFILE_BASE}-${g.pgUserId}`, {});
      console.log(`  --- Datos bajo Firebase UID ---`);
      console.log(`  profile.firstName: ${firebaseProfile.firstName || "(vacío)"}`);
      console.log(`  profile.lastName: ${firebaseProfile.lastName || "(vacío)"}`);
      console.log(`  profile.email: ${firebaseProfile.email || "(vacío)"}`);
      const guestProfile = readJson(`${USER_PROFILE_BASE}-${g.id}`, {});
      console.log(`  --- Datos originales bajo Guest UID ---`);
      console.log(`  guest.firstName: ${guestProfile.firstName || "(vacío)"}`);
      if (firebaseProfile.firstName !== guestProfile.firstName) {
        console.log(`  ⚠️ DISCREPANCIA: Firebase UID="${firebaseProfile.firstName}" vs Guest UID="${guestProfile.firstName}"`);
      }
    }
    console.log("──────────────────────────────────────────");
  });

  const seen = {};
  let hasDuplicates = false;
  index.forEach(g => {
    if (g.pgUserId) {
      if (seen[g.pgUserId]) {
        console.log(`\n❌ CONFLICTO: "${seen[g.pgUserId].name}" y "${g.name}" comparten pgUserId: ${g.pgUserId}`);
        hasDuplicates = true;
      } else {
        seen[g.pgUserId] = g;
      }
    }
  });
  if (!hasDuplicates) console.log("\n✅ No se detectaron conflictos de unicidad.");
  return { index, hasConflicts: hasDuplicates };
}

function repairDuplicateMigrations() {
  const index = getGuestIndex();
  const pgMap = {};
  const conflicts = [];

  index.forEach((g, i) => {
    if (g.pgUserId) {
      if (pgMap[g.pgUserId] !== undefined) {
        conflicts.push({ firstIdx: pgMap[g.pgUserId], dupIdx: i, pgUserId: g.pgUserId });
      } else {
        pgMap[g.pgUserId] = i;
      }
    }
  });

  if (!conflicts.length) {
    console.log("✅ No hay conflictos que reparar.");
    return;
  }

  conflicts.forEach(({ firstIdx, dupIdx, pgUserId }) => {
    const keep = index[firstIdx];
    const reset = index[dupIdx];
    console.log(`Reparando: "${reset.name}" (${reset.id}) → pgUserId: ${pgUserId} → (ninguno)`);
    reset.migrated = false;
    reset.pgUserId = null;
  });

  saveGuestIndex(index);
  console.log(`\n✅ ${conflicts.length} conflicto(s) reparado(s). La entrada más antigua conserva la vinculación.`);
  diagnoseMigrations();
}

async function migrateGuestToGoogle() {
  const guestUid = localStorage.getItem("uid");
  if (!guestUid || !guestUid.startsWith(GUEST_PREFIX)) {
    throw new Error("No hay sesión de invitado.");
  }

  const index = getGuestIndex();
  const entry = index.find(g => g.id === guestUid);
  if (entry?.migrated) {
    throw new Error("Este perfil invitado ya está vinculado a una cuenta de Google.");
  }

  if (checkGuestIntegrity()) {
    throw new Error("Error de integridad: múltiples perfiles vinculados a la misma cuenta Google. Ejecuta repairDuplicateMigrations() en la consola para corregir.");
  }

  const user = await loginWithGoogle();
  const firebaseUid = user.uid;

  const existing = index.find(g => g.pgUserId === firebaseUid && g.id !== guestUid);
  if (existing) {
    throw new Error(`Esta cuenta de Google ya está vinculada al perfil "${existing.name}". Cada cuenta puede vincularse a un único perfil.`);
  }

  const bases = [
    USER_PROFILE_BASE,
    ACTIVITY_BASE,
    COMPLETED_EXERCISES_BASE,
    "drillup-sports-carry"
  ];

  bases.forEach((base) => {
    const oldKey = `${base}-${guestUid}`;
    const newKey = `${base}-${firebaseUid}`;
    const data = localStorage.getItem(oldKey);
    if (data) {
      localStorage.setItem(newKey, data);
    }
  });

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.includes(guestUid) && !bases.some(b => key === `${b}-${guestUid}`)) {
      localStorage.setItem(key.replace(guestUid, firebaseUid), localStorage.getItem(key));
    }
  }

  try {
    const oldDbName = `drillup-sports-videos-${guestUid}`;
    const newDbName = `drillup-sports-videos-${firebaseUid}`;

    const videos = await new Promise((resolve) => {
      const request = indexedDB.open(oldDbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("videos", { keyPath: "id" });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("videos")) { db.close(); resolve([]); return; }
        const tx = db.transaction("videos", "readonly");
        const getAll = tx.objectStore("videos").getAll();
        getAll.onsuccess = () => { db.close(); resolve(getAll.result); };
        getAll.onerror = () => { db.close(); resolve([]); };
      };
      request.onerror = () => resolve([]);
    });

    if (videos.length) {
      await new Promise((resolve) => {
        const request = indexedDB.open(newDbName, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("videos", { keyPath: "id" });
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("videos", "readwrite");
          videos.forEach(v => tx.objectStore("videos").put(v));
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
        };
        request.onerror = () => resolve();
      });
    }
  } catch (e) {
    console.warn("Migración de videos omitida", e);
  }

  if (entry) {
    entry.migrated = true;
    entry.pgUserId = firebaseUid;
    saveGuestIndex(index);
  }

  saveSession(user);
  syncProfileWithFirebase(user);
}

async function logout() {
  if (!isGuest()) {
    await auth.signOut();
  }
  clearSession();
  const c = document.querySelector("#adminLinkContainer");
  if (c) c.innerHTML = "";
  window.location.href = "/login";
}

function protectPage(allowedRoles) {

    

    const session = getSession();

    if (!session) {
        window.location.href = "/login";
        return;
    }

    if (allowedRoles && !allowedRoles.includes(session.rol)) {
        window.location.href = "/login";
    }
}

function normalizeFirebaseError(err) {
  const map = {
    "auth/user-not-found": "No hay cuenta con este correo electrónico.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Este correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e intenta de nuevo.",
    "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de completar el inicio.",
    "auth/cancelled-popup-request": "Ya hay una ventana de Google abierta."
  };
  return new Error(map[err.code] || err.message || "Error de autenticación.");
}

function resetMigrationState(guestId) {
  const index = getGuestIndex();
  const entry = index.find(g => g.id === guestId);
  if (!entry) { console.error(`Perfil no encontrado: ${guestId}`); return; }
  entry.migrated = false;
  entry.pgUserId = null;
  saveGuestIndex(index);
  console.log(`✅ Perfil "${entry.name}" (${guestId}) — migrated=false, pgUserId=null. Listo para nueva vinculación.`);
}

function auditStorage() {
  console.log("%c=== STORAGE AUDIT ===", "font-size:1.4em;font-weight:bold");
  const index = getGuestIndex();
  const drillKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("drillup-sports") || k.startsWith("drillup-guest"))) drillKeys.push(k);
  }

  console.log(`\n%c── Invitados registrados ──`, "font-weight:bold");
  index.forEach(g => {
    const keyProfile = `${USER_PROFILE_BASE}-${g.id}`;
    const hasProfile = drillKeys.includes(keyProfile);
    const hasActivity = drillKeys.includes(`${ACTIVITY_BASE}-${g.id}`);
    const hasExercises = drillKeys.includes(`${COMPLETED_EXERCISES_BASE}-${g.id}`);
    if (g.migrated && !g.pgUserId) {
      console.log(`  %c❌ "${g.name}" (${g.id}) — migrated=true pero pgUserId vacío`, "color:#e74c3c");
    } else if (!g.migrated && g.pgUserId) {
      console.log(`  %c❌ "${g.name}" (${g.id}) — migrated=false pero pgUserId definido: ${g.pgUserId}`, "color:#e74c3c");
    } else if (g.migrated && g.pgUserId) {
      const fbProfile = readJson(`${USER_PROFILE_BASE}-${g.pgUserId}`, {});
      if (!hasProfile && !hasActivity && !hasExercises) {
        console.log(`  %c⚠ "${g.name}" (${g.id}) — migrado a ${g.pgUserId} pero sin datos locales`, "color:#f39c12");
      } else if (fbProfile.firstName && fbProfile.firstName !== g.name) {
        console.log(`  %c⚠ "${g.name}" — migrado a ${g.pgUserId} pero Firebase UID tiene nombre "${fbProfile.firstName}"`, "color:#f39c12");
      } else {
        console.log(`  %c✅ "${g.name}" (${g.id}) — migrado a ${g.pgUserId}`, "color:#2ecc71");
      }
    } else {
      console.log(`  %c✅ "${g.name}" (${g.id}) — perfil local`, "color:#2ecc71");
    }
  });

  console.log(`\n%c── Claves localStorage ──`, "font-weight:bold");
  const dataKeys = drillKeys.filter(k => k !== GUEST_INDEX_KEY);
  const firebaseUid = auth.currentUser?.uid || null;
  if (!dataKeys.length) {
    console.log("  (ninguna)");
  } else {
    dataKeys.forEach(k => {
      if (firebaseUid && k.endsWith(`-${firebaseUid}`)) {
        console.log(`  %c✅ ${k} → usuario Firebase activo`, "color:#2ecc71");
        return;
      }
      const guestMatch = index.find(g => k.endsWith(`-${g.id}`));
      const pgMatch = index.find(g => k.endsWith(`-${g.pgUserId}`));
      if (guestMatch) {
        console.log(`  %c✅ ${k} → perfil "${guestMatch.name}"`, "color:#2ecc71");
      } else if (pgMatch) {
        console.log(`  %c⚠ ${k} → Firebase UID de "${pgMatch.name}" (perfil migrado)`, "color:#f39c12");
      } else {
        console.log(`  %c⚠ ${k} → sin perfil asociado (huérfano)`, "color:#f39c12");
      }
    });
    console.log(`\n  Total: ${dataKeys.length} claves`);
  }

  console.log(`\n%c── Migraciones ──`, "font-weight:bold");
  const migrated = index.filter(g => g.migrated);
  if (!migrated.length) {
    console.log("  No hay perfiles migrados.");
  } else {
    migrated.forEach(g => {
      console.log(`  "${g.name}" → Firebase UID: ${g.pgUserId}`);
      const fbData = readJson(`${USER_PROFILE_BASE}-${g.pgUserId}`, {});
      const guestData = readJson(`${USER_PROFILE_BASE}-${g.id}`, {});
      const match = fbData.firstName === guestData.firstName;
      console.log(`    Datos: ${match ? "✅ coherentes" : "⚠ posible sobrescritura"}`);
    });
  }
  console.log("\n%c────────────────────", "font-weight:bold");
}

function auditStorageDetailed() {
  console.log("%c╔═══════════════════════════════════════╗", "font-size:1.4em;font-weight:bold");
  console.log("%c║       AUDITORÍA DETALLADA             ║", "font-size:1.4em;font-weight:bold");
  console.log("%c╚═══════════════════════════════════════╝\n", "font-size:1.4em;font-weight:bold");

  const currentUid = getCurrentFirebaseUid();
  const session = getSession();
  const index = getGuestIndex();

  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("drillup-sports") || k.startsWith("drillup-guest"))) allKeys.push(k);
  }
  const dataKeys = allKeys.filter(k => k !== GUEST_INDEX_KEY);

  // ── FIREBASE USERS ──
  console.log("%c── FIREBASE USERS ───────────────────────", "font-weight:bold");
  if (currentUid && session) {
    console.log(`  UID:      ${currentUid}`);
    console.log(`  Email:    ${session.email || "(no disponible)"}`);
    console.log(`  Nombre:   ${session.nombre || "(no disponible)"}`);
    console.log(`  Rol:      ${session.rol || "(no disponible)"}`);
    console.log(`  Status:   activo\n`);
    console.log(`  %cClaves asociadas:`, "font-weight:bold");
    const userKeys = dataKeys.filter(k => k.endsWith(`-${currentUid}`));
    if (userKeys.length) {
      userKeys.forEach(k => console.log(`    %c✅ ${k}`, "color:#2ecc71"));
    } else {
      console.log(`    (sin claves locales)`);
    }
    console.log(`\n  Total: ${userKeys.length} claves`);
  } else {
    console.log("  (no hay sesión Firebase activa)\n");
  }

  // ── GUEST USERS ──
  console.log(`\n%c── GUEST USERS (guest:index) ────────────`, "font-weight:bold");
  if (!index.length) {
    console.log("  (vacío — no hay perfiles invitados)\n");
  } else {
    console.log(`  Total entradas: ${index.length}\n`);
    index.forEach(g => {
      const hasData = dataKeys.some(k => k.endsWith(`-${g.id}`));
      const hasPgData = g.pgUserId ? dataKeys.some(k => k.endsWith(`-${g.pgUserId}`)) : false;
      let status;
      if (g.migrated && !g.pgUserId) status = "❌ migrated=true sin pgUserId";
      else if (!g.migrated && g.pgUserId) status = "❌ migrated=false con pgUserId";
      else if (g.migrated && g.pgUserId) status = `✅ migrado → ${g.pgUserId}`;
      else status = "✅ perfil local";
      console.log(`  "${g.name}" (${g.id})`);
      console.log(`    Status: ${status}`);
      console.log(`    Datos: ${hasData ? "✅ presentes" : "⚠ ausentes"}`);
      if (g.pgUserId && hasPgData) console.log(`    Datos Firebase: ✅ presentes`);
      if (g.pgUserId && !hasPgData) console.log(`    Datos Firebase: ⚠ ausentes`);
      console.log("");
    });
  }

  // ── ORPHAN KEYS ──
  console.log(`%c── ORPHAN KEYS ───────────────────────────`, "font-weight:bold");
  const orphanKeys = dataKeys.filter(k => {
    if (currentUid && k.endsWith(`-${currentUid}`)) return false;
    const matchesGuest = index.some(g => k.endsWith(`-${g.id}`));
    const matchesPg = index.some(g => k.endsWith(`-${g.pgUserId}`));
    return !matchesGuest && !matchesPg;
  });
  if (!orphanKeys.length) {
    console.log("  ✅ No hay claves huérfanas\n");
  } else {
    console.log(`  %c⚠ ${orphanKeys.length} clave(s) huérfana(s):\n`, "color:#f39c12");
    orphanKeys.forEach(k => console.log(`    ⚠ ${k}`));
    console.log("");
  }

  // ── SUMMARY ──
  console.log(`%c── RESUMEN ────────────────────────────────`, "font-weight:bold");
  const guestKeys = dataKeys.filter(k => index.some(g => k.endsWith(`-${g.id}`)));
  const pgKeys = dataKeys.filter(k => index.some(g => k.endsWith(`-${g.pgUserId}`)));
  const currentUserKeys = currentUid ? dataKeys.filter(k => k.endsWith(`-${currentUid}`)) : [];
  const accountedKeys = new Set([...currentUserKeys, ...guestKeys, ...pgKeys].map(k => k));
  const trulyOrphans = dataKeys.filter(k => !accountedKeys.has(k));

  console.log(`  Total claves drillup:  ${dataKeys.length}`);
  console.log(`  Usuario Firebase:      ${currentUserKeys.length}`);
  console.log(`  Perfiles invitados:    ${guestKeys.length}`);
  if (pgKeys.length) console.log(`  Firebase de migrados:  ${pgKeys.length}`);
  console.log(`  Huérfanas reales:      %c${trulyOrphans.length}`, trulyOrphans.length ? "color:#f39c12;font-weight:bold" : "color:#2ecc71;font-weight:bold");
  console.log(`\n%c──────────────────────────────────────────`, "font-weight:bold");
}

function getCurrentFirebaseUid() {
  if (auth.currentUser) return auth.currentUser.uid;
  const uid = localStorage.getItem("uid");
  if (uid && !uid.startsWith(GUEST_PREFIX)) return uid;
  return null;
}

function cleanupOrphanedAccounts() {
  console.log("%c=== Limpieza de Perfiles Huérfanos ===", "font-size:1.2em;font-weight:bold");
  const currentUid = getCurrentFirebaseUid();
  const index = getGuestIndex();
  const orphaned = [];

  index.forEach(g => {
    if (g.migrated && !g.pgUserId) {
      orphaned.push({ ...g, reason: "migrated=true pero pgUserId vacío" });
    } else if (!g.migrated && g.pgUserId) {
      orphaned.push({ ...g, reason: "migrated=false pero pgUserId definido" });
    } else if (g.migrated && g.pgUserId) {
      const fbProfile = readJson(`${USER_PROFILE_BASE}-${g.pgUserId}`, {});
      const guestProfile = readJson(`${USER_PROFILE_BASE}-${g.id}`, {});
      if (fbProfile.firstName && fbProfile.firstName !== guestProfile.firstName) {
        orphaned.push({ ...g, reason: `Firebase UID contiene "${fbProfile.firstName}", guest tiene "${guestProfile.firstName}" — posible sobrescritura externa` });
      } else if (!fbProfile.firstName && !guestProfile.firstName) {
        orphaned.push({ ...g, reason: "migrado sin datos de perfil" });
      }
    }
  });

  const seen = {};
  index.forEach(g => {
    if (g.pgUserId) {
      if (seen[g.pgUserId]) {
        if (!orphaned.find(o => o.id === g.id)) {
          orphaned.push({ ...g, reason: `pgUserId duplicado con "${seen[g.pgUserId].name}"` });
        }
      } else {
        seen[g.pgUserId] = g;
      }
    }
  });

  // Exclude current Firebase user from orphan consideration
  const beforeFilter = orphaned.length;
  const filtered = orphaned.filter(p => p.id !== currentUid);
  const removedCount = beforeFilter - filtered.length;
  if (removedCount > 0) {
    console.log(`  (excluidos ${removedCount} perfil(es) que coinciden con el usuario Firebase activo)`);
  }

  if (!filtered.length) {
    console.log("✅ No se encontraron perfiles huérfanos o inconsistentes (excluyendo usuario activo).");
    return [];
  }

  console.log(`\nSe encontraron ${filtered.length} perfil(es) con problemas:\n`);
  filtered.forEach(p => {
    console.log(`  Perfil: "${p.name}"`);
    console.log(`  Guest ID: ${p.id}`);
    console.log(`  Firebase UID: ${p.pgUserId || "(ninguno)"}`);
    console.log(`  Estado: ${p.reason}`);
    console.log("  ──────────────────────────");
  });

  console.log("\nUsa resetMigrationState(guestId) para resetear un perfil manteniendo sus datos.");
  console.log("  Ejemplo: resetMigrationState('" + filtered[0].id + "')\n");
  console.log("Usa purgeOrphanedAccounts() para eliminar completamente los perfiles huérfanos.");
  return filtered;
}

async function purgeOrphanedAccounts() {
  const currentUid = getCurrentFirebaseUid();
  const orphaned = cleanupOrphanedAccounts().filter(p => p.id !== currentUid);
  if (!orphaned.length) return;

  const confirmed = confirm(
    `¿Eliminar ${orphaned.length} perfil(es) huérfano(s) definitivamente?\n\n` +
    orphaned.map(p => `• "${p.name}" (${p.id})`).join("\n") +
    "\n\nSe borrarán todos los datos locales asociados. Esta acción no se puede deshacer."
  );
  if (!confirmed) { console.log("Cancelado."); return; }

  orphaned.forEach(p => {
    const index = getGuestIndex();
    const updated = index.filter(e => e.id !== p.id);
    saveGuestIndex(updated);

    [USER_PROFILE_BASE, ACTIVITY_BASE, COMPLETED_EXERCISES_BASE, "drillup-sports-carry"].forEach(base => {
      try { localStorage.removeItem(`${base}-${p.id}`); } catch {}
    });
    try { indexedDB.deleteDatabase(`drillup-sports-videos-${p.id}`); } catch {}

    console.log(`  Eliminado: "${p.name}" (${p.id})`);
  });

  console.log(`\n✅ ${orphaned.length} perfil(es) eliminado(s).`);
  auditStorage();
}

function purgeRealOrphans() {
  console.log("%c=== PURGE REAL ORPHANS ===", "font-size:1.4em;font-weight:bold");

  const currentUid = getCurrentFirebaseUid();
  if (!currentUid) {
    console.error("❌ No hay sesión Firebase activa.");
    return;
  }

  const index = getGuestIndex();
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("drillup-sports") || k.startsWith("drillup-guest"))) allKeys.push(k);
  }
  const dataKeys = allKeys.filter(k => k !== GUEST_INDEX_KEY);

  const orphanKeys = dataKeys.filter(k => {
    if (k.endsWith(`-${currentUid}`)) return false;
    const matchesGuest = index.some(g => k.endsWith(`-${g.id}`));
    const matchesPg = index.some(g => k.endsWith(`-${g.pgUserId}`));
    return !matchesGuest && !matchesPg;
  });

  const preservedKeys = dataKeys.filter(k => !orphanKeys.includes(k));

  if (!orphanKeys.length) {
    console.log("\n✅ No hay claves huérfanas que eliminar.");
    console.log(`\n%c──────────────────────────────────────────`, "font-weight:bold");
    return;
  }

  console.log(`\n%cClaves huérfanas encontradas (${orphanKeys.length}):`, "color:#f39c12;font-weight:bold");
  orphanKeys.forEach(k => console.log(`  ⚠ ${k}`));

  const confirmed = confirm(
    `¿Eliminar ${orphanKeys.length} clave(s) huérfana(s) definitivamente?\n\n` +
    orphanKeys.join("\n") +
    "\n\nSolo se eliminarán claves sin perfil asociado.\n" +
    `Los datos del usuario Firebase actual NO serán afectados.\n` +
    "Esta acción no se puede deshacer."
  );
  if (!confirmed) { console.log("Cancelado."); return; }

  let deleted = 0;
  let errors = 0;
  orphanKeys.forEach(k => {
    try {
      localStorage.removeItem(k);
      deleted++;
    } catch {
      errors++;
    }
  });

  // Final report
  console.log(`\n%c=== ORPHAN PURGE REPORT ===`, "font-size:1.2em;font-weight:bold");
  console.log(`  Huérfanas encontradas: ${orphanKeys.length}`);
  console.log(`  Huérfanas eliminadas:  ${deleted}`);
  console.log(`  Claves preservadas:    ${preservedKeys.length}`);
  console.log(`  Errores:               ${errors}`);
  console.log(`\n%c──────────────────────────────────────────`, "font-weight:bold");

  auditStorageDetailed();
}

function deleteGuestData(guestId, guestName) {
  const index = getGuestIndex();
  const updated = index.filter(e => e.id !== guestId);
  saveGuestIndex(updated);
  [USER_PROFILE_BASE, ACTIVITY_BASE, COMPLETED_EXERCISES_BASE, "drillup-sports-carry"].forEach(base => {
    try { localStorage.removeItem(`${base}-${guestId}`); } catch {}
  });
  try { indexedDB.deleteDatabase(`drillup-sports-videos-${guestId}`); } catch {}
  console.log(`  Eliminado: "${guestName}" (${guestId})`);
}

function cleanupAllGuests() {
  const session = getSession();
  if (!session || isGuest()) {
    console.error("❌ Debes iniciar sesión con tu cuenta Google antes de ejecutar esta limpieza.");
    return;
  }
  if (!auth.currentUser) {
    console.error("❌ No hay sesión Firebase activa. Recarga la página e intenta de nuevo.");
    return;
  }

  console.log("%c=== LIMPIEZA COMPLETA DEL SISTEMA ===", "font-size:1.4em;font-weight:bold");
  console.log(`\nSesión activa: ${session.email || auth.currentUser.email}`);
  console.log(`Firebase UID: ${session.uid}`);
  console.log(`Rol: ${session.rol}\n`);

  const targetNames = ["emmanuel", "samuel", "alejandro"];
  const index = getGuestIndex();

  // 1. Find targets
  const targets = index.filter(g => targetNames.includes(g.name.toLowerCase()));
  console.log(`Perfiles objetivo a eliminar (${targets.length}):`);
  targets.forEach(g => console.log(`  • "${g.name}" (${g.id})${g.migrated ? ` — migrado a ${g.pgUserId}` : ""}`));

  // 2. Find orphans (keys whose guest UUID doesn't match any index entry)
  const allGuestIds = index.map(g => g.id);
  const orphanKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("drillup-sports-")) continue;
    if (k === GUEST_INDEX_KEY) continue;
    const gIdx = k.indexOf("guest_");
    if (gIdx === -1) continue;
    const extractedId = k.slice(gIdx);
    if (!allGuestIds.includes(extractedId)) {
      orphanKeys.push(k);
    }
  }
  if (orphanKeys.length) {
    console.log(`\nClaves huérfanas sin perfil asociado (${orphanKeys.length}):`);
    orphanKeys.forEach(k => console.log(`  ⚠ ${k}`));
  }

  // 3. Find inconsistent migration entries
  const inconsistent = index.filter(g => {
    if (g.migrated && !g.pgUserId) return true;
    if (!g.migrated && g.pgUserId) return true;
    return false;
  });
  if (inconsistent.length) {
    console.log(`\nEntradas inconsistentes (${inconsistent.length}):`);
    inconsistent.forEach(g => console.log(`  ❌ "${g.name}" — migrated=${g.migrated}, pgUserId=${g.pgUserId || "null"}`));
  }

  // Count totals
  const totalToDelete = targets.length + inconsistent.length;
  if (!totalToDelete && !orphanKeys.length) {
    console.log("\n✅ No hay perfiles guest, huérfanos ni inconsistencias que limpiar. El sistema ya está limpio.");
    console.log("%cSistema limpio y consistente", "font-size:1.2em;font-weight:bold;color:#2ecc71");
    auditStorage();
    return;
  }

  // Confirmation
  let msg = `¿Eliminar ${targets.length} perfil(es) guest definitivamente?\n\n`;
  targets.forEach(g => msg += `• "${g.name}" (${g.id})\n`);
  if (inconsistent.length) {
    msg += `\nAdemás se corregirán ${inconsistent.length} entradas inconsistentes.\n`;
  }
  if (orphanKeys.length) {
    msg += `\nAdemás se eliminarán ${orphanKeys.length} claves huérfanas.\n`;
  }
  msg += "\nSe eliminarán todos los datos locales (perfil, actividad, ejercicios, videos).\n";
  msg += "Los datos de la cuenta Google actual NO serán afectados.\n";
  msg += "\nEsta acción no se puede deshacer.";
  if (!confirm(msg)) { console.log("Cancelado."); return; }

  // Execute cleanup
  let deleted = 0;
  let orphanDeleted = 0;

  // Delete target guest profiles
  targets.forEach(g => { deleteGuestData(g.id, g.name); deleted++; });

  // Delete orphan keys
  orphanKeys.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
    orphanDeleted++;
  });

  // Fix remaining inconsistent entries (after target deletion)
  const after = getGuestIndex();
  let fixedCount = 0;
  after.forEach(g => {
    if ((g.migrated && !g.pgUserId) || (!g.migrated && g.pgUserId)) {
      g.migrated = false;
      g.pgUserId = null;
      fixedCount++;
      console.log(`  Corregido: "${g.name}" — reset migración`);
    }
  });
  if (fixedCount) saveGuestIndex(after);

  // Final audit
  console.log("\n");
  auditStorage();

  // Final report
  console.log(`\n%c=== REPORTE FINAL ===`, "font-size:1.2em;font-weight:bold");
  console.log(`  1. Perfiles eliminados: ${deleted}`);
  console.log(`  2. Claves huérfanas eliminadas: ${orphanDeleted}`);
  console.log(`  3. Entradas inconsistentes corregidas: ${fixedCount}`);
  console.log(`  4. Datos de cuenta Google: intactos ✅`);
  console.log(`\n%cSistema limpio y consistente`, "font-size:1.4em;font-weight:bold;color:#2ecc71");
}
