@extends('layouts.app')

@section('title', 'DrillUp Sports')

@section('body-class', 'auth-pending')


@push('styles')

<link rel="stylesheet" href="{{ asset('assets/css/animations.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/exercises.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/history.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/signals.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/plays.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/videos.css') }}">

@endpush


@section('content')


<div class="app-shell">
    <header class="topbar">
      <button class="icon-button menu-button" id="openMenu" type="button" aria-label="Abrir menú">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="brand-center">
        <p class="eyebrow">Aprendizaje deportivo</p>
        <h1 class="brand-logo"><span>DrillUp</span> <strong>Sports</strong></h1>
      </div>

      <div class="user-chip-skeleton"><div class="skeleton-circle"></div><div class="skeleton-lines"><div class="skeleton-line w-60"></div><div class="skeleton-line w-80"></div></div></div>
      <a class="user-chip" href="#usuario" aria-label="Abrir perfil">
        <span class="user-avatar"></span>
        <span class="user-name"></span>
        <span class="user-email"></span>
      </a>
    </header>

    <aside class="sidebar" id="sidebar" aria-hidden="true">
      <div class="sidebar-header">
        <strong class="brand-logo"><span>DrillUp</span> <strong>Sports</strong></strong>
        <button class="icon-button close-button" id="closeMenu" type="button" aria-label="Cerrar menú">X</button>
      </div>

      <nav class="nav-list" aria-label="Navegación principal">
    <a href="#ejercicios"><span class="nav-icon">🏀</span>Ejercicios</a>
    <a href="#jugadas"><span class="nav-icon">📋</span>Jugadas</a>
    <a href="#senales"><span class="nav-icon">🚩</span>Señalizaciones arbitrales</a>

    <a href="#historia"><span class="nav-icon">📚</span>Historia del baloncesto</a>

    <a href="#videos"><span class="nav-icon">🎬</span>Mis Videos</a>
    <a href="#usuario"><span class="nav-icon">👤</span>Usuario</a>
    <div id="adminLinkContainer"></div>
</nav>

      <div class="theme-control">
        <span>Modo de pantalla</span>
        <button class="theme-option light-option" id="lightMode" type="button" aria-label="Activar modo claro">
          <span class="theme-icon">☀️</span>
          <span>Claro</span>
        </button>
        <button class="theme-option dark-option active" id="darkMode" type="button" aria-label="Activar modo oscuro">
          <span class="theme-icon">🌙</span>
          <span>Oscuro</span>
        </button>
      </div>
    </aside>

    <button class="page-overlay" id="overlay" type="button" aria-label="Cerrar menú"></button>

    <section class="avatar-modal" id="avatarModal" hidden aria-live="polite">
      <div class="avatar-modal-card">
        <button class="avatar-close" id="closeAvatarModal" type="button" aria-label="Cerrar foto">X</button>
        <button class="avatar-large" id="changeAvatarButton" type="button" aria-label="Cambiar foto de perfil">
          <span id="avatarLargeContent">E</span>
          <span class="camera-layer">📷</span>
        </button>
        <p>Foto de perfil</p>
        <input id="avatarFileInput" type="file" accept="image/*" hidden>
      </div>
    </section>

    <section class="logout-modal" id="logoutModal" hidden aria-live="polite">
      <div class="logout-card">
        <h2>¿Seguro que quieres cerrar sesión?</h2>
        <p>Se cerrará tu sesión y volverás a la pantalla de acceso.</p>
        <div>
          <button class="danger-action" id="confirmLogout" type="button">Sí</button>
          <button class="secondary-action compact-action" id="cancelLogout" type="button">No</button>
        </div>
      </div>
    </section>

    <main>
      <section class="intro view active-view" id="homeView">
        <div>
          <p class="eyebrow">Sección de ejercicios</p>
          <h2>Entrena fundamentos de basket y preparación física</h2>

          <div class="progress-container" aria-label="Progreso general de ejercicios">
            <div class="progress-info">
              <span>Progreso General</span>
              <span id="progressLabel"></span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" id="progressFill"></div>
            </div>
          </div>
        </div>
        <p>Escoge una categoría para ver ejercicios con descripción, nivel y animación del movimiento.</p>
      </section>

      <section class="exercise-grid view active-view" id="exerciseGrid" aria-label="Categorías de ejercicios"></section>

      <section class="category-view view" id="categoryView" aria-live="polite">
        <button class="back-link" id="backToHome" type="button">← Atrás</button>
        <div class="section-heading">
          <p class="eyebrow">Rutina seleccionada</p>
          <h2 id="categoryTitle">Dribbling</h2>
          <p id="categoryDescription">Aquí se muestran los ejercicios disponibles de la sección que seleccionaste.</p>
        </div>
        <div class="routine-grid" id="routineGrid"></div>
        <button class="primary-action" id="firstRoutineButton" type="button">Comenzar rutina</button>
      </section>

      <section class="detail-view view" id="detailView" aria-live="polite">
        <div class="detail-top">
          <button class="back-link" id="backToCategory" type="button">← Atrás</button>
        </div>

        <div class="detail-layout">
          <div class="detail-animation">
            <p class="eyebrow" id="detailCategory">Dribbling</p>
            <h2 id="detailTitle">Ejercicio</h2>
            <div class="animation-stage large-stage" id="detailAnimation"></div>
          </div>

          <aside class="detail-copy">
            <div class="help-panel" id="helpPanel">
              <h3>¿Para qué funciona?</h3>
              <p id="helpText"></p>
            </div>
            <h3>Descripción</h3>
            <p id="detailDescription"></p>
            <div class="detail-meta">
              <span id="detailLevel">Nivel básico</span>
              <div class="timer-control">
                <span id="detailTime">45 segundos</span>
                <button id="timerButton" type="button">Iniciar</button>
                <strong id="timerDisplay">00:45</strong>
              </div>
            </div>
          </aside>
        </div>

        <div class="detail-controls">
          <button class="secondary-action" id="previousExercise" type="button">← Anterior</button>
          <button class="primary-action" id="nextExercise" type="button">Siguiente →</button>
        </div>
      </section>

      <section class="content-view view" id="contentView" aria-live="polite">

        <div id="historyContent" class="history-content" hidden>
          <section class="history-hero">
            <div class="history-copy">
              <p class="eyebrow">Historia del baloncesto</p>
              <h2>Origen, evolución y legado del basket</h2>
              <p>El baloncesto nació en 1891 como una solución creativa para entrenar bajo techo durante el invierno. Con el tiempo, pasó de jugarse con cestas de durazno y un balón de fútbol a convertirse en uno de los deportes más practicados del mundo.</p>
            </div>

            <figure class="creator-card">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Dr._James_Naismith.jpg/500px-Dr._James_Naismith.jpg" alt="James Naismith sosteniendo un balón y una cesta">
              <figcaption>
                <strong>James Naismith</strong>
                <span>Creador del baloncesto en 1891.</span>
              </figcaption>
            </figure>
          </section>

          <section class="history-grid" aria-label="Resumen histórico">
            <article><span class="history-icon">🏀</span><h3>¿Dónde nació?</h3><p>En Springfield, Massachusetts, Estados Unidos, dentro de la escuela de formación de la YMCA.</p></article>
            <article><span class="history-icon">💡</span><h3>¿Por qué se creó?</h3><p>Para mantener activos a los estudiantes durante el invierno, evitando juegos demasiado bruscos o peligrosos.</p></article>
            <article><span class="history-icon">📜</span><h3>Primeras reglas</h3><p>Naismith escribió 13 reglas básicas. Al principio no existía el dribbling como se conoce hoy.</p></article>
          </section>

          <section class="timeline" aria-label="Línea de tiempo del baloncesto">
            <h3>Evolución del baloncesto</h3>
            <div class="timeline-list">
              <article><span>1891</span><p>James Naismith crea el baloncesto usando una pelota y dos cestas de durazno.</p></article>
              <article><span>1892</span><p>El juego empieza a difundirse y se publican sus primeras reglas.</p></article>
              <article><span>1936</span><p>El baloncesto se convierte en deporte olímpico oficial en los Juegos de Berlín.</p></article>
              <article><span>Actualidad</span><p>Es un deporte global, con ligas profesionales, torneos internacionales y millones de practicantes.</p></article>
            </div>
          </section>

          <section class="original-rules-section" aria-label="Reglas originales del baloncesto">
            <div>
              <p class="eyebrow">1891</p>
              <h3>Las 13 reglas originales</h3>
              <p>James Naismith escribio estas reglas para que el juego fuera ordenado, seguro y facil de practicar bajo techo.</p>
            </div>
            <ol class="rules-list">
              <li>El balon podia lanzarse en cualquier direccion con una o ambas manos.</li>
              <li>El balon podia golpearse en cualquier direccion con una o ambas manos, pero no con el puno.</li>
              <li>El jugador no podia correr con el balon; debia pasarlo desde donde lo recibia.</li>
              <li>El balon debia sostenerse con las manos, no con brazos o cuerpo.</li>
              <li>No se permitia empujar, sujetar, golpear ni cargar contra un rival.</li>
              <li>Golpear el balon con el puno o cometer contacto indebido contaba como falta.</li>
              <li>Tres faltas consecutivas de un equipo daban un punto al rival.</li>
              <li>Se marcaba punto cuando el balon entraba y permanecia en la cesta.</li>
              <li>Si el balon salia, se reanudaba con saque del primer jugador que lo tocara.</li>
              <li>El juez vigilaba jugadores, faltas y conducta del partido.</li>
              <li>El arbitro principal controlaba el balon, puntos y tiempo.</li>
              <li>El partido se jugaba en dos tiempos de 15 minutos con descanso.</li>
              <li>Ganaba el equipo con mas puntos al terminar el tiempo.</li>
            </ol>
          </section>

          <section class="legacy-section">
            <div>
              <p class="eyebrow">Legado</p>
              <h3>Referentes que marcaron el baloncesto</h3>
              <p>Después de su creación, el baloncesto creció gracias a entrenadores, ligas, selecciones y jugadores que llevaron el deporte a un nivel mundial.</p>
            </div>

            <div class="legacy-grid" aria-label="Referentes del baloncesto">
              <article><strong>James Naismith</strong><span>Creador del baloncesto y autor de sus primeras reglas.</span></article>
              <article><strong>Michael Jordan</strong><span>Ícono mundial por su impacto deportivo y cultural.</span></article>
              <article><strong>NBA y FIBA</strong><span>Organizaciones que ayudaron a expandir el juego profesional e internacional.</span></article>
            </div>

            <details class="sources-box">
              <summary>Fuentes consultadas</summary>
              <a href="https://en.wikipedia.org/wiki/James_Naismith" target="_blank" rel="noreferrer">Biografía de James Naismith</a>
              <a href="https://en.wikipedia.org/wiki/Basketball" target="_blank" rel="noreferrer">Historia general del baloncesto</a>
            </details>
          </section>
        </div>

        <div id="refereeContent" class="referee-content" hidden>
          <div id="signalsListView" class="signals-list-view">
            <section class="learning-hero signals-hero">
              <div>
                <p class="eyebrow">Señalizaciones arbitrales</p>
                <h2>Aprende a leer cada decisión del árbitro</h2>
                <p>Explora las señales por categoría y abre cada tarjeta para estudiar su interpretación, regla y explicación completa.</p>
              </div>
              <aside class="module-stat-card">
                <span class="stat-number" id="signalsCount">0</span>
                <span>señales disponibles</span>
              </aside>
            </section>
            <div class="category-strip" id="signalsCategories"></div>
            <div class="signals-board" id="signalsBoard"></div>
          </div>

          <section id="signalInlineDetail" class="signal-inline-detail" hidden aria-live="polite">
            <button class="back-link" id="backToSignals" type="button">← Volver a señales</button>

            <div class="signal-detail-card">
              <div class="signal-detail-visual">
                <p class="eyebrow" id="inlineSignalCategory">Categoría</p>
                <div id="inlineSignalFigure" class="signal-figure signal-traveling"></div>
              </div>

              <article class="signal-detail-copy">
                <h2 id="inlineSignalTitle">Señal arbitral</h2>

                <div class="signal-info-block">
                  <h3>Descripción</h3>
                  <p id="inlineSignalDescription"></p>
                </div>

                <div class="signal-info-block">
                  <h3>Interpretación arbitral</h3>
                  <p id="inlineSignalInterpretation"></p>
                </div>

                <div class="signal-info-block">
                  <h3>Explicación</h3>
                  <p id="inlineSignalExplanation"></p>
                </div>

                <div class="signal-info-block">
                  <h3>Regla</h3>
                  <p id="inlineSignalRule"></p>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div id="playsContent" class="plays-content" hidden>
          <section id="playsListView" class="plays-list-view">
            <div class="du-jugadas-hero">
              <p class="eyebrow">Jugadas</p>
              <h2>Estrategias y sistemas de juego</h2>
              <p>Explora jugadas ofensivas y defensivas con animaciones paso a paso. Comprende los movimientos y posiciones para mejorar tu visión del juego.</p>
            </div>
            <div class="plays-summary">
              <span class="stat-number" id="playsCount">0</span>
              <span>jugadas base</span>
            </div>
            <div class="plays-grid" id="playsGrid"></div>
          </section>

          <section id="playDetailView" class="play-detail-view" hidden aria-live="polite">
            <div class="detail-top">
              <button class="back-link" id="backToPlays" type="button">← Atrás</button>
              <span class="du-play-type-badge offense" id="playDetailBadge">Ofensiva</span>
            </div>

            <div class="du-play-detail-layout">
              <div class="du-play-court-wrap">
                <p class="eyebrow" id="playDetailEyebrow">Jugada</p>
                <h2 id="playDetailTitle">Pick and Roll</h2>
                <div class="du-play-court-box" id="playCourtBox"></div>
                <div class="du-play-progress-bar">
                  <div class="du-play-progress-fill" id="playProgressFill"></div>
                </div>
              </div>

              <aside class="detail-copy">
                <div class="du-step-dots" id="playStepDots"></div>
                <div class="help-panel">
                  <h3 id="playStepTitle">Paso 1</h3>
                  <p id="playStepDescription"></p>
                </div>

                <h3>Leyenda</h3>
                <div class="du-play-legend">
                  <div class="du-legend-row"><span class="legend-dot offense">1</span><span>Jugador ofensivo</span></div>
                  <div class="du-legend-row"><span class="legend-dot defense">D1</span><span>Jugador defensivo</span></div>
                  <div class="du-legend-row"><span class="legend-line move"></span><span>Movimiento</span></div>
                  <div class="du-legend-row"><span class="legend-line pass"></span><span>Pase</span></div>
                </div>
              </aside>
            </div>

            <div class="du-play-controls">
              <button class="secondary-action" id="previousPlayStep" type="button">← Anterior</button>
              <button class="du-play-btn" id="playAutoButton" type="button">▶ Reproducir</button>
              <button class="primary-action" id="nextPlayStep" type="button">Siguiente →</button>
            </div>
          </section>
        </div>

        <div id="profileContent" class="profile-content" hidden>
          <section class="user-section">
            <div class="profile-card">
              <div class="profile-avatar" id="profileAvatar"></div>
              <h2 id="profileName"></h2>
              <p id="profileEmail"></p>
              <div class="profile-actions">
                <button class="edit-profile-btn" id="editProfileButton" type="button">Editar perfil</button>
                <button class="secondary-action compact-action" id="linkGoogleButton" type="button" hidden>Vincular Google</button>
                <button class="secondary-action compact-action" id="logoutButton" type="button">Salir</button>
              </div>
            </div>

            <section class="dashboard-card" aria-labelledby="securityTitle">
              <div class="dashboard-title-row">
                <div>
                  <p class="eyebrow">Seguridad</p>
                  <h3 id="securityTitle">Seguridad y acceso</h3>
                </div>
              </div>
              <p class="security-hint">Estos métodos permiten acceder a la misma cuenta de DrillUp Sports.</p>
              <div class="security-body">
                <div class="security-row">
                  <span class="security-label">Correo principal</span>
                  <strong class="security-value" id="securityMainEmail"></strong>
                </div>
                <div>
                  <span class="security-label">Métodos vinculados</span>
                  <div id="securityProvidersList" class="security-providers"></div>
                </div>
              </div>
            </section>

            <section class="profile-data-card dashboard-card" aria-labelledby="profileDataTitle">
              <div class="dashboard-title-row">
                <div>
                  <p class="eyebrow">Datos del usuario</p>
                  <h3 id="profileDataTitle">Informacion personal</h3>
                </div>
                <span class="profile-status">Local</span>
              </div>
              <div class="profile-data-grid">
                <article><span>Nombre</span><strong id="profileFirstName"></strong></article>
                <article><span>Apellidos</span><strong id="profileLastName"></strong></article>
                <article><span>Fecha de nacimiento</span><strong id="profileBirthDate"></strong></article>
                <article><span>Edad</span><strong id="profileAge"></strong></article>
                <article><span>Peso</span><strong id="profileWeight"></strong></article>
                <article><span>Altura</span><strong id="profileHeight"></strong></article>
                <article><span>Sexo</span><strong id="profileSex"></strong></article>
                <article><span>Mano dominante</span><strong id="profileHand"></strong></article>
                <article><span>Posición preferida</span><strong id="profilePosition"></strong></article>
              </div>
            </section>

            <section class="profile-form-panel dashboard-card" id="profileFormPanel" hidden aria-labelledby="profileFormTitle">
              <div class="dashboard-title-row">
                <div>
                  <p class="eyebrow">Editar perfil</p>
                  <h3 id="profileFormTitle">Datos personales</h3>
                </div>
                <button class="secondary-action compact-action" id="cancelProfileButton" type="button">Cancelar</button>
              </div>
              <form class="profile-form" id="profileForm">
                <label>Nombre<input id="firstNameInput" name="firstName" type="text" autocomplete="given-name"></label>
                <label>Apellidos<input id="lastNameInput" name="lastName" type="text" autocomplete="family-name"></label>
                <label>Fecha de nacimiento<input id="birthDateInput" name="birthDate" type="date"></label>
                <label>Edad<input id="ageInput" name="age" type="number" min="1" max="120" inputmode="numeric"></label>
                <label>Peso (kg)<input id="weightInput" name="weight" type="number" min="1" max="300" step="0.1" inputmode="decimal"></label>
                <label>Altura<input id="heightInput" name="height" type="text" placeholder="Ej: 1.80 m o 180 cm" inputmode="decimal"></label>
                <label>Sexo
                  <select id="sexInput" name="sex">
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                    <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                </label>
                <label>Mano dominante
                  <select id="handInput" name="dominantHand">
                    <option value="">Seleccionar</option>
                    <option value="Derecha">Derecha</option>
                    <option value="Izquierda">Izquierda</option>
                    <option value="Ambas">Ambas</option>
                  </select>
                </label>
                <label>Posicion preferida
                  <select id="positionInput" name="position">
                    <option value="">Seleccionar posición</option>
                    <option value="Base (PG)">Base (PG)</option>
                    <option value="Escolta (SG)">Escolta (SG)</option>
                    <option value="Alero (SF)">Alero (SF)</option>
                    <option value="Ala-Pívot (PF)">Ala-Pívot (PF)</option>
                    <option value="Pívot (C)">Pívot (C)</option>
                    <option value="Combo Guard">Combo Guard</option>
                    <option value="Point Forward">Point Forward</option>
                    <option value="Sin preferencia">Sin preferencia</option>
                  </select>
                </label>
                <button class="primary-action form-save-button" type="submit">Guardar cambios</button>
              </form>
            </section>

            <div class="stats-grid" id="statsGrid">
              <article class="stat-card" data-stat="routines"><span id="statRoutines"></span><p>Rutinas completadas</p></article>
              <article class="stat-card" data-stat="exercises"><span id="statExercises"></span><p>Ejercicios realizados</p></article>
              <article class="stat-card" data-stat="hours"><span id="statHours"></span><p>Tiempo entrenando</p></article>
              <article class="stat-card" data-stat="progress"><span id="statProgress"></span><p>Progreso general</p></article>
            </div>
            <p class="stats-feedback" id="statsFeedback">Tu progreso se actualiza con las rutinas y ejercicios completados.</p>

            <div class="dashboard-card screen-dashboard">
              <div class="screen-time-head">
                <button class="screen-time-pill" type="button">Tiempo de uso</button>
                <strong id="selectedUsageTime"></strong>
                <span id="selectedUsageLabel">Hoy</span>
              </div>
              <div class="screen-time-chart" aria-label="Tiempo de uso semanal">
                <div class="screen-grid-lines"></div>
                <div class="screen-bars">
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Dom</span></div>
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Lun</span></div>
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Mar</span></div>
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Mié</span></div>
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Jue</span></div>
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Vie</span></div>
                  <div class="screen-day"><div class="screen-bar empty" style="height:0%"></div><span>Sáb</span></div>
                </div>
              </div>
              <p class="chart-feedback" id="weeklyStatDetail"></p>
              <div class="screen-time-footer">
                <button type="button" aria-label="Semana anterior">‹</button>
                <span></span>
                <button type="button" aria-label="Semana siguiente">›</button>
              </div>
            </div>

            <div class="dashboard-card">
              <h3>Categorías más entrenadas</h3>
              <div class="category-row"><span>Dribbling</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <div class="category-row"><span>Tiro</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <div class="category-row"><span>Pases</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <div class="category-row"><span>Pliometría</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <div class="category-row"><span>Velocidad</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <div class="category-row"><span>Core</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <div class="category-row"><span>Movilidad</span><div class="usage-bar"><div style="width:0%"></div></div><small></small></div>
              <p class="chart-feedback" id="categoryStatDetail"></p>
            </div>

            <div class="dashboard-card">
              <h3>Mi evolución</h3>
              <div class="evolution-grid">
                <div><span>Racha actual</span><strong id="currentStreak"></strong></div>
                <div><span>Mejor racha</span><strong id="bestStreak"></strong></div>
                <div><span>Primer entrenamiento</span><strong id="firstTrainingDate"></strong></div>
                <div><span>Último entrenamiento</span><strong id="lastTrainingDate"></strong></div>
                <div><span>Rutinas completadas</span><strong id="evolutionRoutines"></strong></div>
              </div>
            </div>
          </section>
        </div>

        <div id="videosContent" class="videos-content" hidden>
          <section class="videos-hero">
            <div class="videos-hero-copy">
              <p class="eyebrow">Entrenamiento personal</p>
              <h2>Mis Videos</h2>
              <p>Gestiona tus entrenamientos, análisis y evolución.</p>
            </div>
          </section>

          <div class="videos-action-row">
            <button class="primary-action" id="analyzeVideosBtn" type="button">🤖 Analizar videos</button>
            <button class="secondary-action" id="aiHistoryBtn" type="button">📊 Historial IA</button>
          </div>

          <section class="videos-upload-section dashboard-card">
            <div class="dashboard-title-row">
              <h3>Subir nuevo video</h3>
            </div>
            <form class="videos-upload-form" id="videoUploadForm">
              <label>Fecha<input id="videoDateInput" type="date"></label>
              <label>Tipo de entrenamiento *
                <select id="videoCategoryInput" required>
                  <option value="">Seleccionar categoría</option>
                  <option value="Dribbling">Dribbling</option>
                  <option value="Tiro">Tiro</option>
                  <option value="Pases">Pases</option>
                  <option value="Pliometría">Pliometría</option>
                  <option value="Velocidad">Velocidad</option>
                  <option value="Core">Core</option>
                  <option value="Movilidad">Movilidad</option>
                </select>
              </label>
              <label>Ejercicio *
                <select id="videoExerciseInput" required disabled>
                  <option value="">Primero selecciona una categoría</option>
                </select>
              </label>
              <label>Notas personales
                <textarea id="videoNotesInput" rows="3" placeholder="¿Qué sentiste?, ¿qué salió bien?, ¿qué debes mejorar?"></textarea>
              </label>
              <label class="videos-file-label">
                <input id="videoFileInput" type="file" accept="video/*" hidden>
                <span class="upload-btn-label">Subir video</span>
              </label>
            </form>
          </section>

          <section class="videos-category-list" id="videosCategoryList">
            <div class="dashboard-title-row">
              <h3>Mis videos</h3>
            </div>
            <div id="videosList" aria-live="polite"></div>
            <div id="videoPreviewPanel" class="video-preview-panel" hidden>

    <div class="dashboard-title-row">
        <h3 id="videoPreviewTitle">Vista previa</h3>

        <button
            style="text-align: center;"
            type="button"
            class="secondary-action compact-action"
            onclick="closeVideoPreview()">
            Cerrar
      </button>
    </div>

    <video
        id="videoPreviewPlayer"
        controls
        playsinline
        width="100%">
        
    </video>

</div>
          </section>
        </div>

        <div id="analyzeAIContent" class="analyze-ai-content" hidden>
          <button class="back-link" id="backFromAnalyzeAI" type="button">← Volver a Mis Videos</button>
          <section class="analyze-ai-hero">
            <p class="eyebrow">Análisis con IA</p>
            <h2>Análisis de entrenamiento con IA</h2>
            <p>Selecciona uno de tus videos para recibir retroalimentación personalizada.</p>
          </section>

          <div class="analyze-filters">
            <label>Filtrar por categoría
              <select id="analyzeCategoryFilter">
                <option value="Todas">Todas</option>
                <option value="Dribbling">Dribbling</option>
                <option value="Tiro">Tiro</option>
                <option value="Pases">Pases</option>
                <option value="Pliometría">Pliometría</option>
                <option value="Velocidad">Velocidad</option>
                <option value="Core">Core</option>
                <option value="Movilidad">Movilidad</option>
              </select>
            </label>
          </div>

          <div class="analyze-videos-grid" id="analyzeVideosGrid"></div>

          <div class="analyze-process-panel" id="analyzeProcessPanel" hidden>
            <div class="analyze-process-steps">
              <p class="analyze-step"><span class="step-icon">✓</span> Detectando cuerpo</p>
              <p class="analyze-step"><span class="step-icon">✓</span> Detectando movimiento</p>
              <p class="analyze-step"><span class="step-icon">✓</span> Analizando técnica</p>
              <p class="analyze-step"><span class="step-icon">✓</span> Generando informe</p>
            </div>
            <div class="analyze-progress-bar"><div class="analyze-progress-fill"></div></div>
            <p class="analyze-status-text">Analizando video...</p>
          </div>

          <div class="analyze-results-panel" id="analyzeResultsPanel" hidden>
            <div class="result-score">
              <span class="result-score-number" id="resultScore">8.2</span>
              <span class="result-score-label">/ 10</span>
            </div>

            <div class="result-metrics" id="resultMetrics"></div>

            <div class="result-section">
              <h4>Fortalezas</h4>
              <ul class="result-strengths"></ul>
            </div>

            <div class="result-section">
              <h4>Aspectos a mejorar</h4>
              <ul class="result-weaknesses"></ul>
            </div>

            <div class="result-section">
              <h4>Ejercicios recomendados</h4>
              <ul class="result-exercises"></ul>
            </div>

            <div class="result-actions">
              <button class="primary-action" id="newAnalysisBtn" type="button">Nuevo análisis</button>
            </div>
          </div>
        </div>

        <div id="aiHistoryContent" class="ai-history-content" hidden>
          <button class="back-link" id="backFromAIHistory" type="button">← Volver a Mis Videos</button>
          <section class="ai-history-hero">
            <p class="eyebrow">Historial</p>
            <h2>Historial de análisis</h2>
          </section>

          <div class="ai-history-chart-container">
            <canvas id="aiEvolutionChart"></canvas>
            <div class="chart-empty-state">Gráfico de evolución — datos disponibles tras realizar análisis</div>
          </div>

          <div class="ai-history-table" id="aiHistoryTable"></div>
        </div>

        <div id="placeholderContent" class="section-heading" hidden>
          <p class="eyebrow">DrillUp Sports</p>
          <h2 id="contentTitle">Bienvenido</h2>
          <p id="contentDescription">Selecciona una sección del menú para comenzar.</p>
        </div>
      </section>
    </main>
  </div>


@endsection


@push('scripts')

<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="{{ asset('assets/js/auth.js') }}" defer></script>
<script src="{{ asset('assets/js/page-protect.js') }}" defer></script>
<script src="{{ asset('assets/js/app.js') }}" defer></script>
<script src="{{ asset('assets/js/exercises.js') }}" defer></script>
<script src="{{ asset('assets/js/signals.js') }}" defer></script>
<script src="{{ asset('assets/js/plays.js') }}" defer></script>
<script src="{{ asset('assets/js/user.js') }}" defer></script>
<script src="{{ asset('assets/js/videos.js') }}" defer></script>

@endpush
