window.DrillUp = window.DrillUp || {};

DrillUp.dom = {
  sidebar: document.querySelector("#sidebar"),
  overlay: document.querySelector("#overlay"),
  openMenu: document.querySelector("#openMenu"),
  closeMenu: document.querySelector("#closeMenu"),
  lightMode: document.querySelector("#lightMode"),
  darkMode: document.querySelector("#darkMode"),
  homeView: document.querySelector("#homeView"),
  exerciseGrid: document.querySelector("#exerciseGrid"),
  categoryView: document.querySelector("#categoryView"),
  detailView: document.querySelector("#detailView"),
  contentView: document.querySelector("#contentView"),
  historyContent: document.querySelector("#historyContent"),
  refereeContent: document.querySelector("#refereeContent"),
  playsContent: document.querySelector("#playsContent"),
  profileContent: document.querySelector("#profileContent"),
  videosContent: document.querySelector("#videosContent"),
  analyzeAIContent: document.querySelector("#analyzeAIContent"),
  aiHistoryContent: document.querySelector("#aiHistoryContent"),
  placeholderContent: document.querySelector("#placeholderContent"),
  contentTitle: document.querySelector("#contentTitle"),
  contentDescription: document.querySelector("#contentDescription")
};

DrillUp.sections = {
  "#historia": {
    title: "Historia del baloncesto",
    description: "Origen, evolución, referentes y fuentes del baloncesto."
  },
  "#senales": {
    title: "Señalizaciones arbitrales",
    description: "Señales oficiales organizadas por categoría con detalle individual."
  },
  "#jugadas": {
    title: "Jugadas",
    description: "Jugadas ofensivas y defensivas con diagramas de cancha."
  },
  "#videos": {
    title: "Mis Videos",
    description: "Gestiona tus entrenamientos, análisis y evolución."
  },
  "#usuario": {
    title: "Usuario",
    description: "Perfil, progreso y actividad de entrenamiento."
  }
};

DrillUp.getSectionHash = function getSectionHash(hash = window.location.hash) {
  if (hash.startsWith("#senales/")) {
    return "#senales";
  }

  return hash;
};

DrillUp.showViews = function showViews(...views) {
  [
    DrillUp.dom.homeView,
    DrillUp.dom.exerciseGrid,
    DrillUp.dom.categoryView,
    DrillUp.dom.detailView,
    DrillUp.dom.contentView
  ].forEach((view) => view.classList.remove("active-view"));

  views.forEach((view) => view.classList.add("active-view"));
  window.scrollTo({ top: 0, behavior: "smooth" });
};

DrillUp.showHome = function showHome() {
  DrillUp.cancelRoutine?.();
  DrillUp.stopTimer?.();
  document.title = "DrillUp Sports - Entrenamiento de Baloncesto";
  DrillUp.showViews(DrillUp.dom.homeView, DrillUp.dom.exerciseGrid);
  DrillUp.setActiveNav("#ejercicios");
};

DrillUp.showContent = function showContent(hash) {
  DrillUp.cancelRoutine?.();
  DrillUp.stopTimer?.();
  const sectionHash = DrillUp.getSectionHash(hash);
  const section = DrillUp.sections[sectionHash];

  if (!section) {
    DrillUp.showHome();
    return;
  }

  if (!hash.startsWith("#senales/")) {
    document.title = "DrillUp Sports - Entrenamiento de Baloncesto";
  }

  const isHistory = sectionHash === "#historia";
  const isReferee = sectionHash === "#senales";
  const isPlays = sectionHash === "#jugadas";
  const isProfile = sectionHash === "#usuario";
  const isVideos = sectionHash === "#videos";

  DrillUp.dom.historyContent.hidden = !isHistory;
  DrillUp.dom.refereeContent.hidden = !isReferee;
  if (!isPlays && typeof DrillUp.stopPlayAuto === "function") {
    DrillUp.stopPlayAuto();
  }
  DrillUp.dom.playsContent.hidden = !isPlays;
  DrillUp.dom.profileContent.hidden = !isProfile;
  DrillUp.dom.videosContent.hidden = !isVideos;
  DrillUp.dom.analyzeAIContent.hidden = !isVideos;
  DrillUp.dom.aiHistoryContent.hidden = !isVideos;
  DrillUp.dom.placeholderContent.hidden = isHistory || isReferee || isPlays || isProfile || isVideos;

  if (!isHistory && !isReferee && !isPlays && !isProfile && !isVideos) {
    DrillUp.dom.contentTitle.textContent = section.title;
    DrillUp.dom.contentDescription.textContent = section.description;
  }

  DrillUp.setActiveNav(sectionHash);
  DrillUp.showViews(DrillUp.dom.contentView);

  if (isPlays && typeof DrillUp.showPlaysList === "function") {
    DrillUp.showPlaysList();
  }
  if (isVideos && typeof DrillUp.showVideosView === "function") {
    DrillUp.showVideosView();
  }
};

DrillUp.setActiveNav = function setActiveNav(hash) {
  document.querySelectorAll(".nav-list a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
};

DrillUp.openSidebar = function openSidebar() {
  DrillUp.dom.sidebar.classList.add("open");
  DrillUp.dom.sidebar.setAttribute("aria-hidden", "false");
  DrillUp.dom.overlay.classList.add("show");
};

DrillUp.closeSidebar = function closeSidebar() {
  DrillUp.dom.sidebar.classList.remove("open");
  DrillUp.dom.sidebar.setAttribute("aria-hidden", "true");
  DrillUp.dom.overlay.classList.remove("show");
};

DrillUp.updateThemeButtons = function updateThemeButtons() {
  const isLight = document.body.classList.contains("light");
  DrillUp.dom.lightMode.classList.toggle("active", isLight);
  DrillUp.dom.darkMode.classList.toggle("active", !isLight);
};

DrillUp.setTheme = function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  DrillUp.updateThemeButtons();

  try {
    localStorage.setItem("drillup-theme", theme);
  } catch (error) {
    // El tema visual sigue funcionando aunque el navegador no guarde preferencias.
  }
};

DrillUp.signalFigureMarkup = function signalFigureMarkup() {
  return `
    <span class="ref-head"></span>
    <span class="ref-body"></span>
    <span class="ref-arm left"></span>
    <span class="ref-arm right"></span>
  `;
};

DrillUp.animationMarkup = function animationMarkup(type) {
  if (type === "passes") {
    return `
      <div class="stickman passes left-player">
        <span class="head"></span><span class="torso"></span><span class="arm arm-left"></span><span class="arm arm-right"></span><span class="leg leg-left"></span><span class="leg leg-right"></span><span class="ball"></span>
      </div>
      <div class="stickman receiver">
        <span class="head"></span><span class="torso"></span><span class="arm arm-left"></span><span class="arm arm-right"></span><span class="leg leg-left"></span><span class="leg leg-right"></span>
      </div>
    `;
  }

  const extra = type === "plyo"
    ? '<div class="box"></div>'
    : type === "speed"
      ? '<div class="speed-line"></div>'
      : type === "core"
        ? '<div class="floor-line"></div>'
        : "";

  const ball = type === "dribble" || type === "shot" ? '<span class="ball"></span>' : "";

  return `
    ${extra}
    <div class="stickman ${type}">
      <span class="head"></span><span class="torso"></span><span class="arm arm-left"></span><span class="arm arm-right"></span><span class="leg leg-left"></span><span class="leg leg-right"></span>${ball}
    </div>
  `;
};

DrillUp.showNotification = function showNotification(icon, title, message, type) {
  let container = document.querySelector(".drillup-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "drillup-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `drillup-toast ${type || "success"}`;
  toast.innerHTML = `
    <div class="drillup-toast-icon">${icon}</div>
    <div class="drillup-toast-body">
      <div class="drillup-toast-title">${title}</div>
      ${message ? `<div class="drillup-toast-message">${message}</div>` : ""}
    </div>
  `;
  container.appendChild(toast);

  const duration = type === "celebration" ? 4000 : 2800;
  setTimeout(() => {
    toast.style.animation = "drillup-toast-out 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

function initAppShell() {
  let savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("drillup-theme") || "dark";
  } catch (error) {
    savedTheme = "dark";
  }

  if (savedTheme === "light") {
    document.body.classList.add("light");
  }

  DrillUp.updateThemeButtons();

  DrillUp.dom.openMenu.addEventListener("click", DrillUp.openSidebar);
  DrillUp.dom.closeMenu.addEventListener("click", DrillUp.closeSidebar);
  DrillUp.dom.overlay.addEventListener("click", DrillUp.closeSidebar);
  DrillUp.dom.lightMode.addEventListener("click", () => DrillUp.setTheme("light"));
  DrillUp.dom.darkMode.addEventListener("click", () => DrillUp.setTheme("dark"));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      DrillUp.closeSidebar();
    }
  });

  document.querySelectorAll(".nav-list a, .user-chip").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) return;
      event.preventDefault();

      if (href === "#ejercicios") {
        DrillUp.showHome();
        window.location.hash = href.replace("#", "");
      } else {
        DrillUp.showContent(href);
        window.location.hash = href.replace("#", "");
      }

      DrillUp.closeSidebar();
    });
  });

  window.addEventListener("hashchange", () => {
    const hash = window.location.hash;

    if (!hash || hash === "#ejercicios") {
      DrillUp.showHome();
      return;
    }

    DrillUp.showContent(hash);

    if (typeof DrillUp.syncSignalRoute === "function") {
      DrillUp.syncSignalRoute(hash);
    }
  });

  if (window.location.hash && window.location.hash !== "#ejercicios") {
    DrillUp.showContent(window.location.hash);
  } else {
    DrillUp.showHome();
  }
}

initAppShell();
