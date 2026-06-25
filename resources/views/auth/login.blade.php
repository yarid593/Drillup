@extends('layouts.app')

@section('title', 'Iniciar sesión')
@section('body-class', 'auth-page')

@push('styles')
<link rel="stylesheet" href="{{ asset('assets/css/login.css') }}">
@endpush

@section('content')

<div class="auth-hero">
    <div class="auth-hero-content">
        <strong class="brand-logo">
            <span>DrillUp</span> <strong>Sports</strong>
        </strong>

        <h2>Aprende. Entrena. Mejora.</h2>

        <p>
            Lleva el control de tus ejercicios, progreso y rendimiento deportivo.
        </p>

        <div class="auth-tagline">
            <span>Ejercicios guiados</span>
            <span>Estadísticas</span>
            <span>Progreso real</span>
        </div>
    </div>
</div>

<div class="auth-panel">

    <div class="auth-form-wrap" id="authScreen">

        <h2>Bienvenido</h2>

        <p class="auth-subtitle">
            Elige cómo quieres ingresar
        </p>

        <div id="loginError" class="auth-error" hidden></div>

        <button id="googleLogin"
                class="auth-btn"
                type="button">
            Continuar con Google
        </button>

        <div class="auth-divider">o</div>

        <button id="guestEntryBtn"
                class="auth-btn"
                type="button"
                style="background:transparent;border:1px solid var(--line);color:var(--text);margin-bottom:20px">
            Entrar como invitado
        </button>

    </div>

    <div class="auth-form-wrap" id="guestScreen" hidden>

        <h2>Elige tu perfil</h2>

        <p class="auth-subtitle" id="guestScreenSubtitle">
            Selecciona uno existente o crea uno nuevo
        </p>

        <div id="guestError" class="auth-error" hidden></div>

        <div id="guestGrid" class="guest-grid"></div>

        <div id="guestNewForm" hidden>

            <div class="auth-field">

                <label for="guestNameField">
                    Tu nombre
                </label>

                <div class="input-wrap">

                    <input
                        id="guestNameField"
                        type="text"
                        placeholder="Ej: Juan"
                        maxlength="30"
                        autocomplete="off">

                </div>

            </div>

            <button
                id="createGuestBtn"
                class="auth-btn"
                type="button">
                Crear perfil invitado
            </button>

        </div>

        <button
            id="guestBackBtn"
            class="auth-btn"
            type="button"
            style="background:transparent;border:1px solid var(--line);color:var(--text);margin-top:16px">
            Volver
        </button>

    </div>

</div>

@endsection

@push('scripts')

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>

<script src="{{ asset('assets/js/auth.js') }}"></script>
<script type="module" src="{{ asset('assets/js/login.js') }}"></script>

@endpush