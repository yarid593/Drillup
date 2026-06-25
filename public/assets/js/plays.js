const plays = window.DRILLUP_PLAYS || [];
const playsGrid = document.querySelector("#playsGrid");
const playsCount = document.querySelector("#playsCount");
const playsListView = document.querySelector("#playsListView");
const playDetailView = document.querySelector("#playDetailView");
const playDetailBadge = document.querySelector("#playDetailBadge");
const playDetailEyebrow = document.querySelector("#playDetailEyebrow");
const playDetailTitle = document.querySelector("#playDetailTitle");
const playCourtBox = document.querySelector("#playCourtBox");
const playProgressFill = document.querySelector("#playProgressFill");
const playStepDots = document.querySelector("#playStepDots");
const playStepTitle = document.querySelector("#playStepTitle");
const playStepDescription = document.querySelector("#playStepDescription");
const backToPlays = document.querySelector("#backToPlays");
const previousPlayStep = document.querySelector("#previousPlayStep");
const playAutoButton = document.querySelector("#playAutoButton");
const nextPlayStep = document.querySelector("#nextPlayStep");

let currentPlayIndex = 0;
let currentStepIndex = 0;
let playInterval = null;

function stopPlayAuto() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }

  playAutoButton.textContent = currentStepIndex >= getCurrentPlay().steps.length - 1 ? "↺ Reiniciar" : "▶ Reproducir";
}

function getCurrentPlay() {
  return plays[currentPlayIndex];
}

function courtSvg(content = "", mini = false) {
  const lineWidth = mini ? 1.5 : 2;
  const opacity = mini ? 0.8 : 0.92;
  return `
    <svg viewBox="0 0 400 380" class="du-court-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowM" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="rgba(255,255,255,0.88)"></path>
        </marker>
        <marker id="arrowP" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#ff6a1a"></path>
        </marker>
      </defs>
      <rect width="400" height="380" fill="var(--court-wood)"></rect>
      ${Array.from({ length: 10 }, (_, i) => (
        `<line x1="0" y1="${35 + i * 32}" x2="400" y2="${35 + i * 32}" stroke="rgba(0,0,0,0.07)" stroke-width="1"></line>`
      )).join("")}
      <rect x="10" y="10" width="380" height="360" fill="none" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth + 0.5}"></rect>
      <rect x="140" y="226" width="120" height="124" fill="rgba(150,55,8,0.28)" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></rect>
      <line x1="140" y1="226" x2="260" y2="226" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></line>
      <path d="M 154,226 A 46 46 0 0 1 246,226" fill="none" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></path>
      <path d="M 154,226 A 46 46 0 0 0 246,226" fill="none" stroke="rgba(255,255,255,${opacity * 0.7})" stroke-width="${lineWidth}" stroke-dasharray="5 4"></path>
      <path d="M 180,350 A 20 20 0 0 1 220,350" fill="none" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></path>
      <line x1="177" y1="358" x2="223" y2="358" stroke="rgba(255,255,255,0.97)" stroke-width="${lineWidth + 1}"></line>
      <circle cx="200" cy="350" r="9" fill="none" stroke="rgba(255,140,40,0.95)" stroke-width="${lineWidth + 0.5}"></circle>
      <line x1="33" y1="370" x2="33" y2="290" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></line>
      <line x1="367" y1="370" x2="367" y2="290" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></line>
      <path d="M 33,290 A 177 177 0 0 0 367,290" fill="none" stroke="rgba(255,255,255,${opacity})" stroke-width="${lineWidth}"></path>
      ${content}
    </svg>
  `;
}

function playerDot(player, large = false) {
  const radius = large ? 17 : 13;
  const fontSize = large ? 10 : 8;
  const isBallOnly = player.n === "" && player.team === "offense";

  if (isBallOnly) {
    return `
      <g class="du-player-node" style="transform: translate(${player.x}px, ${player.y}px);">
        <circle r="${radius - 1}" fill="#e85d04" stroke="rgba(255,255,255,0.7)" stroke-width="2"></circle>
        <path d="M ${-(radius - 1)},0 A ${radius - 1} ${radius - 1} 0 0 1 ${radius - 1},0" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"></path>
        <path d="M ${-(radius - 1)},0 A ${radius - 1} ${radius - 1} 0 0 0 ${radius - 1},0" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"></path>
        <path d="M 0,${-(radius - 1)} Q ${radius / 2},0 0,${radius - 1}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"></path>
      </g>
    `;
  }

  const isOffense = player.team === "offense";
  return `
    <g class="du-player-node" style="transform: translate(${player.x}px, ${player.y}px);">
      ${player.ball ? `<circle cx="${radius}" cy="${-radius}" r="${large ? 7 : 6}" fill="#e85d04" stroke="white" stroke-width="1.5"></circle>` : ""}
      <circle r="${radius}" fill="${isOffense ? "#ff6a1a" : "#f4f6ff"}" stroke="${isOffense ? "rgba(255,255,255,0.82)" : "rgba(255,106,26,0.55)"}" stroke-width="2"></circle>
      <text text-anchor="middle" dominant-baseline="central" fill="${isOffense ? "white" : "#111"}" font-size="${fontSize}" font-weight="bold" font-family="Arial,sans-serif">${player.n}</text>
    </g>
  `;
}

function arrowLine(arrow) {
  const dx = arrow.to[0] - arrow.from[0];
  const dy = arrow.to[1] - arrow.from[1];
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 5) {
    return "";
  }

  const trim = 18;
  const ratio = (length - trim) / length;
  const x1 = arrow.from[0] + dx * 0.15;
  const y1 = arrow.from[1] + dy * 0.15;
  const x2 = arrow.from[0] + dx * ratio;
  const y2 = arrow.from[1] + dy * ratio;

  if (arrow.type === "pass") {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff6a1a" stroke-width="2.5" marker-end="url(#arrowP)"></line>`;
  }

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.82)" stroke-width="2" stroke-dasharray="8 4" marker-end="url(#arrowM)"></line>`;
}

function renderCourtStep(step, mini = false) {
  const arrows = (step.arrows || []).map(arrowLine).join("");
  const playersMarkup = step.players.map((player) => playerDot(player, !mini)).join("");
  return courtSvg(`${arrows}${playersMarkup}`, mini);
}

function renderPlayCard(play, index) {
  const card = document.createElement("button");
  card.className = "du-play-card";
  card.type = "button";
  card.innerHTML = `
    <div class="du-play-card-court">${renderCourtStep(play.steps[0], true)}</div>
    <div class="du-play-card-label">
      <strong>${play.title}</strong>
      <span>${play.subtitle}</span>
    </div>
  `;
  card.addEventListener("click", () => openPlayDetail(index));
  return card;
}

function renderPlays() {
  const validPlays = plays.filter((play) => play.title && play.steps && play.steps.length > 0);
  playsCount.textContent = validPlays.length.toString();
  playsGrid.innerHTML = "";

  const groups = [
    { type: "ofensiva", title: "Jugadas Ofensivas", icon: "⚔️" },
    { type: "defensiva", title: "Jugadas Defensivas", icon: "🛡️" }
  ];

  groups.forEach((group) => {
    const block = document.createElement("section");
    block.className = "du-jugadas-block";
    block.innerHTML = `
      <h3 class="du-jugadas-section-title"><span>${group.icon}</span> ${group.title}</h3>
      <div class="du-plays-grid"></div>
    `;

    const grid = block.querySelector(".du-plays-grid");
    validPlays
      .filter((play) => play.type === group.type)
      .forEach((play) => grid.appendChild(renderPlayCard(play, validPlays.indexOf(play))));

    playsGrid.appendChild(block);
  });
}

function openPlayDetail(index) {
  stopPlayAuto();
  currentPlayIndex = index;
  currentStepIndex = 0;
  playsListView.hidden = true;
  playDetailView.hidden = false;
  renderPlayDetail();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPlaysList() {
  stopPlayAuto();
  playsListView.hidden = false;
  playDetailView.hidden = true;
}

DrillUp.showPlaysList = showPlaysList;
DrillUp.stopPlayAuto = stopPlayAuto;

function renderStepDots(play) {
  playStepDots.innerHTML = "";

  play.steps.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = `du-step-dot ${index === currentStepIndex ? "active" : ""}`;
    dot.type = "button";
    dot.textContent = String(index + 1);
    dot.setAttribute("aria-label", `Paso ${index + 1}`);
    dot.addEventListener("click", () => {
      stopPlayAuto();
      currentStepIndex = index;
      renderPlayDetail();
    });
    playStepDots.appendChild(dot);
  });
}

function renderPlayDetail() {
  const play = getCurrentPlay();
  const step = play.steps[currentStepIndex];
  const isLast = currentStepIndex === play.steps.length - 1;

  playDetailBadge.className = `du-play-type-badge ${play.type === "ofensiva" ? "offense" : "defense"}`;
  playDetailBadge.textContent = play.type === "ofensiva" ? "⚔️ Ofensiva" : "🛡️ Defensiva";
  playDetailEyebrow.textContent = play.subtitle;
  playDetailTitle.textContent = play.title;
  playCourtBox.innerHTML = renderCourtStep(step, false);
  playProgressFill.style.width = `${play.steps.length === 1 ? 100 : (currentStepIndex / (play.steps.length - 1)) * 100}%`;
  playStepTitle.textContent = `Paso ${currentStepIndex + 1} de ${play.steps.length}`;
  playStepDescription.textContent = step.desc;
  previousPlayStep.disabled = currentStepIndex === 0;
  nextPlayStep.disabled = isLast;
  playAutoButton.textContent = playInterval ? "⏸ Pausar" : isLast ? "↺ Reiniciar" : "▶ Reproducir";
  renderStepDots(play);
}

function startPlayAuto() {
  const play = getCurrentPlay();

  if (currentStepIndex >= play.steps.length - 1) {
    currentStepIndex = 0;
    renderPlayDetail();
  }

  playAutoButton.textContent = "⏸ Pausar";
  playInterval = setInterval(() => {
    currentStepIndex += 1;

    if (currentStepIndex >= play.steps.length) {
      currentStepIndex = play.steps.length - 1;
      stopPlayAuto();
      renderPlayDetail();
      return;
    }

    renderPlayDetail();
  }, 1600);
}

backToPlays.addEventListener("click", showPlaysList);
previousPlayStep.addEventListener("click", () => {
  stopPlayAuto();
  currentStepIndex = Math.max(0, currentStepIndex - 1);
  renderPlayDetail();
});
nextPlayStep.addEventListener("click", () => {
  stopPlayAuto();
  const play = getCurrentPlay();
  currentStepIndex = Math.min(play.steps.length - 1, currentStepIndex + 1);
  renderPlayDetail();
});
playAutoButton.addEventListener("click", () => {
  if (playInterval) {
    stopPlayAuto();
    return;
  }

  startPlayAuto();
});

renderPlays();
