const signals = window.DRILLUP_SIGNALS || [];
const signalsBoard = document.querySelector("#signalsBoard");
const signalsCategories = document.querySelector("#signalsCategories");
const signalsCount = document.querySelector("#signalsCount");
const signalsListView = document.querySelector("#signalsListView");
const signalInlineDetail = document.querySelector("#signalInlineDetail");
const backToSignals = document.querySelector("#backToSignals");
const inlineSignalCategory = document.querySelector("#inlineSignalCategory");
const inlineSignalFigure = document.querySelector("#inlineSignalFigure");
const inlineSignalTitle = document.querySelector("#inlineSignalTitle");
const inlineSignalDescription = document.querySelector("#inlineSignalDescription");
const inlineSignalInterpretation = document.querySelector("#inlineSignalInterpretation");
const inlineSignalExplanation = document.querySelector("#inlineSignalExplanation");
const inlineSignalRule = document.querySelector("#inlineSignalRule");

function groupSignals(data) {
  return data.reduce((groups, signal) => {
    groups[signal.category] = groups[signal.category] || [];
    groups[signal.category].push(signal);
    return groups;
  }, {});
}

function signalDetailUrl(signal) {
  return `#senales/${encodeURIComponent(signal.id)}`;
}

function showSignalsList() {
  signalsListView.hidden = false;
  signalInlineDetail.hidden = true;
}

function showSignalDetail(signalId) {
  const signal = signals.find((item) => item.id === signalId);

  if (!signal) {
    showSignalsList();
    return;
  }

  signalsListView.hidden = true;
  signalInlineDetail.hidden = false;
  inlineSignalCategory.textContent = signal.category;
  inlineSignalTitle.textContent = signal.title;
  inlineSignalDescription.textContent = signal.description;
  inlineSignalInterpretation.textContent = signal.interpretation;
  inlineSignalExplanation.textContent = signal.explanation;
  inlineSignalRule.textContent = signal.rule;
  inlineSignalFigure.className = `signal-figure ${signal.figure}`;
  inlineSignalFigure.innerHTML = DrillUp.signalFigureMarkup();
  document.title = `DrillUp Sports - ${signal.title}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getSignalIdFromHash(hash = window.location.hash) {
  if (!hash.startsWith("#senales/")) {
    return "";
  }

  return decodeURIComponent(hash.replace("#senales/", ""));
}

function renderSignals(activeCategory = "Todas") {
  const visibleSignals = activeCategory === "Todas"
    ? signals
    : signals.filter((signal) => signal.category === activeCategory);

  const groups = groupSignals(visibleSignals);
  signalsBoard.innerHTML = "";

  Object.entries(groups).forEach(([category, groupItems]) => {
    const section = document.createElement("section");
    section.className = "signal-group";
    section.innerHTML = `
      <div class="signal-group-heading">
        <h3>${category}</h3>
        <span>${groupItems.length} señales</span>
      </div>
      <div class="signals-grid"></div>
    `;

    const grid = section.querySelector(".signals-grid");
    groupItems.forEach((signal) => {
      const card = document.createElement("a");
      card.className = "signal-card";
      card.href = signalDetailUrl(signal);
      card.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.hash = `senales/${signal.id}`;
        DrillUp.showContent("#senales");
        showSignalDetail(signal.id);
      });
      card.innerHTML = `
        <span class="mini-signal ${signal.figure}">${DrillUp.signalFigureMarkup()}</span>
        <strong>${signal.title}</strong>
        <span>${signal.description}</span>
      `;
      grid.appendChild(card);
    });

    signalsBoard.appendChild(section);
  });
}

function renderSignalFilters() {
  const categories = ["Todas", ...new Set(signals.map((signal) => signal.category))];
  signalsCategories.innerHTML = "";

  categories.forEach((category, index) => {
    const button = document.createElement("button");
    button.className = `category-filter ${index === 0 ? "active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      document.querySelectorAll(".category-filter").forEach((filter) => filter.classList.remove("active"));
      button.classList.add("active");
      renderSignals(category);
    });
    signalsCategories.appendChild(button);
  });
}

function initSignals() {
  signalsCount.textContent = signals.length.toString();
  renderSignalFilters();
  renderSignals();
  backToSignals.addEventListener("click", () => {
    document.title = "DrillUp Sports - Entrenamiento de Baloncesto";
    window.location.hash = "senales";
    DrillUp.showContent("#senales");
    showSignalsList();
  });
  DrillUp.syncSignalRoute = function syncSignalRoute(hash = window.location.hash) {
    const signalId = getSignalIdFromHash(hash);

    if (signalId) {
      showSignalDetail(signalId);
      return;
    }

    document.title = "DrillUp Sports - Entrenamiento de Baloncesto";
    showSignalsList();
  };
  DrillUp.syncSignalRoute(window.location.hash);
}

initSignals();
