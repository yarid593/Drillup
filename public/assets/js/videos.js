const VIDEO_STORE = "videos";

function videoDbName() {
  const uid = getSession()?.uid;
  return uid ? `drillup-sports-videos-${uid}` : null;
}

function openVideoDb() {
  const name = videoDbName();
  if (!name) return Promise.reject(new Error("No hay sesión activa"));

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withVideoStore(mode, callback) {
  const db = await openVideoDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, mode);
    const store = tx.objectStore(VIDEO_STORE);
    const result = callback(store);

    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getVideos() {
  return withVideoStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error);
  }));
}

async function saveVideo(video) {
  await withVideoStore("readwrite", (store) => store.put(video));
}

async function deleteVideo(id) {
  await withVideoStore("readwrite", (store) => store.delete(id));
}

function videoEmptyMarkup() {
  return `
    <article class="empty-video-card">
      <strong>Aún no hay videos guardados</strong>
      <p>Sube un video de entrenamiento para recibir análisis y llevar un registro.</p>
    </article>
  `;
}

async function renderVideos() {
  const list = document.querySelector("#videosList");
  if (!list || !window.indexedDB) return;

  const videos = await getVideos();
  videos.forEach(v => { if (v.category) v.category = normalizeCategory(v.category) || v.category; });

  if (!videos.length) {
    list.innerHTML = videoEmptyMarkup();
    return;
  }

  const groups = {};
  videos.forEach(v => {
    const cat = v.category || "Sin categoría";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(v);
  });

  list.innerHTML = Object.entries(groups).map(([cat, items]) => `
    <div class="videos-category-group">
      <h4>${escapeHtml(cat)}</h4>
      ${items.map(v => `
        <article class="video-card" data-video-id="${v.id}">
          <div class="video-card-header">
            <strong>${escapeHtml(v.name)}</strong>
            <span>${v.date ? formatDateDisplay(v.date) : "Sin fecha"}</span>
          </div>
          <p>${escapeHtml(v.exercise || v.description || "Video de entrenamiento")}</p>
          <small>${v.notes ? escapeHtml(v.notes) : "Sin notas personales."}</small>
          <div class="video-actions">
            <button class="secondary-action compact-action" type="button" data-action="view">Ver</button>
            <button class="danger-action" type="button" data-action="delete">Eliminar</button>
          </div>
        </article>
      `).join("")}
    </div>
  `).join("");

  list.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.closest(".video-card").dataset.videoId;
      const all = Object.values(groups).flat();
      showVideoPreview(all.find(v => v.id === id));
    });
  });

  list.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este video?")) return;
      await deleteVideo(button.closest(".video-card").dataset.videoId);
      await renderVideos();
    });
  });
}

function showVideoPreview(video) {
  if (!video) return;

  const panel = document.querySelector("#videoPreviewPanel");
  const player = document.querySelector("#videoPreviewPlayer");
  const title = document.querySelector("#videoPreviewTitle");

  if (panel) panel.hidden = false;
  if (title) title.textContent = video.name;
  if (player) {
    if (player.dataset.url) URL.revokeObjectURL(player.dataset.url);
    const url = URL.createObjectURL(video.file);
    player.src = url;
    player.dataset.url = url;
  }
}

/* ── View switching ── */

function showVideosMain() {
  document.querySelector("#videosContent").hidden = false;
  document.querySelector("#analyzeAIContent").hidden = true;
  document.querySelector("#aiHistoryContent").hidden = true;
}

async function showAnalyzeAI() {
  document.querySelector("#videosContent").hidden = true;
  document.querySelector("#analyzeAIContent").hidden = false;
  document.querySelector("#aiHistoryContent").hidden = true;
  const processPanel = document.querySelector("#analyzeProcessPanel");
  const resultsPanel = document.querySelector("#analyzeResultsPanel");
  if (processPanel) processPanel.hidden = true;
  if (resultsPanel) resultsPanel.hidden = true;
  await renderAnalyzeVideos();
}

function showAIHistory() {
  document.querySelector("#videosContent").hidden = true;
  document.querySelector("#analyzeAIContent").hidden = true;
  document.querySelector("#aiHistoryContent").hidden = false;
  renderHistoryTable();
  initAIChart();
}

/* ── Main videos view ── */

DrillUp.showVideosView = function showVideosView() {
  showVideosMain();
  const dateInput = document.querySelector("#videoDateInput");
  if (dateInput && !dateInput.value) {
    const today = new Date();
    dateInput.value = today.toISOString().split("T")[0];
  }
  if (dateInput) dateInput.max = new Date().toISOString().split("T")[0];
  renderVideos().catch(() => {
    const list = document.querySelector("#videosList");
    if (list) list.innerHTML = videoEmptyMarkup();
  });
};

/* ── Category helpers ── */

const CATEGORY_TO_KEY = {
  "Dribbling": "dribbling",
  "Tiro": "tiro",
  "Pases": "pases",
  "Pliometría": "pliometria",
  "Velocidad": "velocidad",
  "Core": "core",
  "Movilidad": "movilidad"
};

let apiCategories = {};

async function loadCategories() {

    const headers = {
        Accept: "application/json"
    };

    const token = localStorage.getItem("auth_token");

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch("/api/categories", {
        headers
    });

    if (!response.ok) {
        throw new Error("No fue posible cargar las categorías.");
    }

    const data = await response.json();

    apiCategories = {};

    data.forEach(category => {
        apiCategories[category.slug] = category.exercises;
    });
}

function getExercisesForCategory(categoryKey) {
    return apiCategories[categoryKey] || [];
}

function normalizeCategory(cat) {
  if (cat === "Pase") return "Pases";
  if (cat === "Defensa" || cat === "Coordinación") return null;
  return cat;
}

/* ── Upload handler ── */

function initVideoUpload() {

    const fileInput = document.querySelector("#videoFileInput");
    const dateInput = document.querySelector("#videoDateInput");
    const categoryInput = document.querySelector("#videoCategoryInput");
    const exerciseInput = document.querySelector("#videoExerciseInput");
    const notesInput = document.querySelector("#videoNotesInput");
    const form = document.querySelector("#videoUploadForm");

    if (!fileInput || !form) return;

    
    categoryInput.innerHTML = "";

    Object.keys(apiCategories).forEach(slug => {

        const option = document.createElement("option");

        option.value = slug;

        option.textContent = slug
            .replaceAll("-", " ")
            .replace(/\b\w/g, c => c.toUpperCase());

        categoryInput.appendChild(option);

    });

    form.addEventListener("submit", (e) => e.preventDefault());

    categoryInput.addEventListener("change", () => {

        const exercises = getExercisesForCategory(categoryInput.value);

        exerciseInput.innerHTML = `<option value="">${
            exercises.length
                ? "Seleccionar ejercicio"
                : "Sin ejercicios disponibles"
        }</option>`;

        exercises.forEach(ex => {

            const option = document.createElement("option");

            option.value = ex.id;
            option.textContent = ex.name;

            exerciseInput.appendChild(option);

        });

        exerciseInput.disabled = exercises.length === 0;

    });

    
    categoryInput.dispatchEvent(new Event("change"));

    fileInput.addEventListener("change", async () => {

        const file = fileInput.files?.[0];
        if (!file) return;

        const category = categoryInput.value;
        const exercise = exerciseInput.value;

        if (!category) {
            alert("Debes seleccionar un tipo de entrenamiento.");
            fileInput.value = "";
            return;
        }

        if (!exercise) {
            alert("Debes seleccionar un ejercicio.");
            fileInput.value = "";
            return;
        }

        try {

    const formData = new FormData();

    formData.append("video", file);
    formData.append("exercise_id", exercise);

    const token = localStorage.getItem("auth_token");

    const response = await fetch("/api/evaluation-videos", {

        method: "POST",

        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        },

        body: formData

    });

    if (!response.ok) {
        throw new Error("Error al subir el video.");
    }

    showVideoFeedback("Video subido correctamente");

    await renderVideos();

} catch (error) {

    console.error(error);

    showVideoFeedback("Error al subir el video", true);

}

        fileInput.value = "";
        notesInput.value = "";

        categoryInput.selectedIndex = 0;
        categoryInput.dispatchEvent(new Event("change"));

        await renderVideos();

    });

}

function showVideoFeedback(msg, isError) {
  const el = document.querySelector("#videoFeedback") || (() => {
    const d = document.createElement("div");
    d.id = "videoFeedback";
    d.style.cssText = "position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-weight:500;z-index:9999;transition:opacity .3s;background:#166534;color:#fff";
    document.body.appendChild(d);
    return d;
  })();
  el.textContent = msg;
  el.style.background = isError ? "#991b1b" : "#166534";
  el.hidden = false;
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.hidden = true; }, 3000);
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ── Analysis results storage ── */

const ANALYSIS_STORAGE_KEY = "drillup-analysis-results";

function getAnalysisKey() {
  const uid = getSession()?.uid;
  return uid ? `${ANALYSIS_STORAGE_KEY}-${uid}` : null;
}

function getAnalyses() {
  const key = getAnalysisKey();
  if (!key) return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function saveAnalysis(analysis) {
  const key = getAnalysisKey();
  if (!key) return;
  const all = getAnalyses();
  const idx = all.findIndex(a => a.videoId === analysis.videoId);
  if (idx >= 0) all[idx] = analysis;
  else all.push(analysis);
  localStorage.setItem(key, JSON.stringify(all));
}

/* ── Mock results per category (simulated IA) ── */

const MOCK_RESULTS_BY_CATEGORY = {
  Dribbling: {
    score: 8.2,
    metrics: { "Control del balón": 8.2, "Coordinación": 7.5, "Velocidad": 6.8, "Postura": 8.0, "Consistencia": 7.8 },
    strengths: ["Buen control del balón", "Ritmo constante", "Buena coordinación"],
    weaknesses: ["Mantener mejor postura", "Mayor flexión de rodillas", "Mejor control en cambios de dirección"],
    exercises: ["Crossovers rápidos", "Dribbling con dos balones", "Cambios de dirección explosivos"]
  },
  Tiro: {
    score: 7.5,
    metrics: { "Precisión": 7.5, "Arco de tiro": 7.0, "Soltar el balón": 8.0, "Postura": 7.2, "Consistencia": 6.8 },
    strengths: ["Buen arco de tiro", "Soltar el balón rápido", "Buena puntería"],
    weaknesses: ["Consistencia en movimiento", "Mejorar juego de pies", "Tiro bajo presión"],
    exercises: ["Tiro libre repetido", "Tiro en movimiento", "Tiro con defensa"]
  },
  Pases: {
    score: 7.8,
    metrics: { "Precisión de pase": 7.8, "Visión de juego": 7.2, "Velocidad de pase": 7.4, "Toma de decisiones": 7.6, "Coordinación": 7.0 },
    strengths: ["Visión de juego amplia", "Pases precisos", "Buena lectura de defensa"],
    weaknesses: ["Velocidad de ejecución", "Pases largos", "Pases con presión"],
    exercises: ["Pases contra pared", "Pases en movimiento", "Pases con oposición"]
  },
  Pliometría: {
    score: 7.6,
    metrics: { "Potencia de salto": 7.6, "Explosividad": 7.4, "Reacción": 7.2, "Estabilidad": 7.0, "Control de caída": 6.8 },
    strengths: ["Buena potencia de salto", "Reacción rápida", "Estabilidad en caída"],
    weaknesses: ["Control de caída en una pierna", "Explosividad sostenida", "Aterrizaje suave"],
    exercises: ["Saltos al cajón con técnica", "Saltos laterales controlados", "Sentadilla con salto"]
  },
  Velocidad: {
    score: 7.3,
    metrics: { "Aceleración": 7.3, "Velocidad máxima": 6.8, "Cambio de ritmo": 7.0, "Resistencia": 6.6, "Explosividad": 7.2 },
    strengths: ["Buena aceleración", "Salida explosiva", "Cambio de ritmo"],
    weaknesses: ["Mantener velocidad máxima", "Resistencia anaeróbica", "Desaceleración controlada"],
    exercises: ["Sprints con cambio de dirección", "Series de velocidad", "Arranques y paradas"]
  },
  Core: {
    score: 7.4,
    metrics: { "Estabilidad": 7.4, "Fuerza": 7.2, "Resistencia": 7.0, "Control": 7.6, "Equilibrio": 6.8 },
    strengths: ["Buena estabilidad central", "Control postural", "Fuerza funcional"],
    weaknesses: ["Resistencia en series largas", "Equilibrio dinámico", "Rotación de tronco"],
    exercises: ["Planchas con elevación", "Russian twists", "Peso muerto a una pierna"]
  },
  Movilidad: {
    score: 7.8,
    metrics: { "Flexibilidad": 7.8, "Rango de movimiento": 7.6, "Activación": 7.4, "Estabilidad": 7.2, "Simetría": 7.0 },
    strengths: ["Buena flexibilidad", "Rango de movimiento amplio", "Activación muscular"],
    weaknesses: ["Simetría entre lados", "Estabilidad en rangos extremos", "Transición a movimiento explosivo"],
    exercises: ["Estiramientos dinámicos", "Movilidad de cadera", "Activación de glúteos y core"]
  }
};

/* ── Analyze videos view ── */

let _currentVideosForAnalysis = [];

async function renderAnalyzeVideos() {
  const grid = document.querySelector("#analyzeVideosGrid");
  const filter = document.querySelector("#analyzeCategoryFilter");
  if (!grid) return;

  _currentVideosForAnalysis = await getVideos();
  _currentVideosForAnalysis.forEach(v => { v.category = normalizeCategory(v.category) || v.category; });
  const analyses = getAnalyses();

  if (!_currentVideosForAnalysis.length) {
    grid.innerHTML = `<article class="empty-state-card"><strong>No hay videos para analizar</strong><p>Sube un video de entrenamiento desde Mis Videos para comenzar.</p></article>`;
    return;
  }

  const category = filter?.value || "Todas";
  const filtered = category === "Todas"
    ? _currentVideosForAnalysis
    : _currentVideosForAnalysis.filter(v => v.category === category);

  if (!filtered.length) {
    grid.innerHTML = `<article class="empty-state-card"><strong>No hay videos en esta categoría</strong><p>Sube un video de tipo "${category}" para analizarlo.</p></article>`;
    return;
  }

  grid.innerHTML = filtered.map(v => {
    const existing = analyses.find(a => a.videoId === v.id);
    const status = existing ? "done" : "pending";
    return `
      <div class="analyze-video-card" data-video-id="${v.id}">
        <div class="analyze-video-info">
          <strong>${escapeHtml(v.name)}</strong>
          <small>${formatDateDisplay(v.date)} — ${v.category}</small>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="analyze-status-badge ${status}">${status === "done" ? "Analizado" : "Pendiente"}</span>
          <button class="primary-action compact-action" type="button" data-action="analyze">${status === "done" ? "Ver resultado" : "Analizar"}</button>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll("[data-action='analyze']").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".analyze-video-card");
      const videoId = card.dataset.videoId;
      const analyses = getAnalyses();
      const existing = analyses.find(a => a.videoId === videoId);
      if (existing) {
        showAnalysisResults(existing);
      } else {
        const video = _currentVideosForAnalysis.find(v => v.id === videoId);
        if (video) startAnalysisSimulation(video);
      }
    });
  });
}

/* ── Analysis simulation ── */

function startAnalysisSimulation(video) {
  const panel = document.querySelector("#analyzeProcessPanel");
  const results = document.querySelector("#analyzeResultsPanel");
  const steps = panel.querySelectorAll(".analyze-step");
  const fill = panel.querySelector(".analyze-progress-fill");
  const statusText = panel.querySelector(".analyze-status-text");

  results.hidden = true;
  panel.hidden = false;

  steps.forEach(s => { s.classList.remove("active", "done"); });
  fill.style.width = "0%";
  statusText.textContent = "Analizando video...";

  const stepData = [
    { label: "Detectando cuerpo", pct: 25 },
    { label: "Detectando movimiento", pct: 50 },
    { label: "Analizando técnica", pct: 75 },
    { label: "Generando informe", pct: 100 }
  ];

  stepData.forEach((s, i) => {
    setTimeout(() => {
      steps[i].classList.add("active");
    }, i * 1200);

    setTimeout(() => {
      steps[i].classList.remove("active");
      steps[i].classList.add("done");
      fill.style.width = s.pct + "%";
      statusText.textContent = s.label + "...";

      if (i === stepData.length - 1) {
        setTimeout(() => {
          panel.hidden = true;
          const cat = normalizeCategory(video.category) || video.category;
          const mock = MOCK_RESULTS_BY_CATEGORY[cat] || MOCK_RESULTS_BY_CATEGORY.Dribbling;
          const result = {
            videoId: video.id,
            videoName: video.name,
            category: video.category,
            date: new Date().toISOString().split("T")[0],
            score: mock.score,
            metrics: { ...mock.metrics },
            strengths: [...mock.strengths],
            weaknesses: [...mock.weaknesses],
            exercises: [...mock.exercises]
          };
          saveAnalysis(result);
          showAnalysisResults(result);
        }, 600);
      }
    }, i * 1200 + 1000);
  });
}

function showAnalysisResults(result) {
  const panel = document.querySelector("#analyzeResultsPanel");
  const scoreEl = document.querySelector("#resultScore");
  const metricsEl = document.querySelector("#resultMetrics");
  const strengthsEl = document.querySelector(".result-strengths");
  const weaknessesEl = document.querySelector(".result-weaknesses");
  const exercisesEl = document.querySelector(".result-exercises");

  panel.hidden = false;
  if (scoreEl) scoreEl.textContent = result.score.toFixed(1);

  if (metricsEl) {
    metricsEl.innerHTML = Object.entries(result.metrics).map(([label, value]) => {
      const v = typeof value === "number" && value > 10 ? value / 10 : value;
      return `<div class="metric-row"><span>${label}</span><div class="metric-bar"><div style="width:${v * 10}%"></div></div><small>${v.toFixed(1)}</small></div>`;
    }).join("");
  }

  if (strengthsEl) {
    strengthsEl.innerHTML = result.strengths.map(s => `<li>✓ ${s}</li>`).join("");
  }

  if (weaknessesEl) {
    weaknessesEl.innerHTML = result.weaknesses.map(w => `<li>• ${w}</li>`).join("");
  }

  if (exercisesEl) {
    exercisesEl.innerHTML = result.exercises.map(e => `<li>${e}</li>`).join("");
  }
}

/* ── AI History view ── */

let aiChartInstance = null;

function renderHistoryTable() {
  const container = document.querySelector("#aiHistoryTable");
  if (!container) return;

  const analyses = getAnalyses();

  if (!analyses.length) {
    container.innerHTML = `<article class="empty-state-card"><strong>Aún no hay análisis guardados</strong><p>Realiza un análisis desde la sección Analizar Videos para ver tu historial aquí.</p></article>`;
    return;
  }

  container.innerHTML = analyses
    .sort((a, b) => b.date.localeCompare(a.date) || a.videoName.localeCompare(b.videoName))
    .map(a => `
      <article class="history-entry">
        <span class="entry-date">${formatDateDisplay(a.date)}</span>
        <span class="entry-category">${escapeHtml(a.category)}</span>
        <span class="entry-name">${escapeHtml(a.videoName)}</span>
        <span class="entry-score">${a.score.toFixed(1)}</span>
      </article>
    `).join("");
}

function initAIChart() {
  const canvas = document.querySelector("#aiEvolutionChart");
  const container = canvas?.parentElement;
  if (!canvas || !window.Chart) return;

  const analyses = getAnalyses();

  if (aiChartInstance) {
    aiChartInstance.destroy();
    aiChartInstance = null;
  }

  if (!analyses.length) {
    canvas.hidden = true;
    const empty = container.querySelector(".chart-empty-state") || (() => {
      const d = document.createElement("div");
      d.className = "chart-empty-state";
      d.textContent = "Gráfico de evolución — datos disponibles tras realizar análisis";
      container.appendChild(d);
      return d;
    })();
    empty.hidden = false;
    return;
  }

  canvas.hidden = false;
  const empty = container.querySelector(".chart-empty-state");
  if (empty) empty.hidden = true;

  const sorted = [...analyses].sort((a, b) => a.date.localeCompare(b.date));
  const labels = sorted.map(a => {
    const parts = a.date.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : a.date;
  });
  const data = sorted.map(a => a.score);

  const ctx = canvas.getContext("2d");

  Chart.defaults.color = "#94a3b8";
  Chart.defaults.borderColor = "rgba(148,163,184,0.15)";

  aiChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Puntuación",
        data,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2 }
        }
      }
    }
  });
}

/* ── Init ── */

async function initVideosModule() {

    await loadCategories();

    await renderVideos(); 

    const backFromAnalyze = document.querySelector("#backFromAnalyzeAI");
    const backFromHistory = document.querySelector("#backFromAIHistory");
    const analyzeBtn = document.querySelector("#analyzeVideosBtn");
    const historyBtn = document.querySelector("#aiHistoryBtn");
    const filter = document.querySelector("#analyzeCategoryFilter");
    const newAnalysisBtn = document.querySelector("#newAnalysisBtn");

  backFromAnalyze?.addEventListener("click", () => {
    showVideosMain();
  });

  backFromHistory?.addEventListener("click", () => {
    showVideosMain();
  });

  analyzeBtn?.addEventListener("click", () => {
    showAnalyzeAI();
  });

  historyBtn?.addEventListener("click", () => {
    showAIHistory();
  });

  filter?.addEventListener("change", renderAnalyzeVideos);

  newAnalysisBtn?.addEventListener("click", () => {
    const resultsPanel = document.querySelector("#analyzeResultsPanel");
    if (resultsPanel) resultsPanel.hidden = true;
    showAnalyzeAI();
  });

  initVideoUpload();
}

initVideosModule().catch(console.error);
