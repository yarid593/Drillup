@extends('layouts.app')

@section('title', 'Panel de Administración')

@section('body-class', 'admin-body')

@push('styles')
<link rel="stylesheet" href="{{ asset('assets/css/admin.css') }}">
@endpush

@section('content')

<div class="admin-layout">
    <aside class="admin-sidebar" id="adminSidebar">
        <a href="#" class="sidebar-brand">
            <span class="brand-icon">🏀</span>
            <div>
                <strong>DrillUp</strong>
                <span>Sports</span>
            </div>
        </a>

        <nav class="sidebar-nav" id="sidebarNav">
            <a href="#" data-section="resume" class="active">
                <span class="nav-icon">📊</span>
                <span>Resumen General</span>
            </a>

            <a href="#" data-section="users">
                <span class="nav-icon">👥</span>
                <span>Administrar usuarios</span>
            </a>

            <a href="#" data-section="exercises">
                <span class="nav-icon">🏀</span>
                <span>Ejercicios</span>
            </a>

            <a href="#" data-section="signals">
                <span class="nav-icon">🚩</span>
                <span>Señales Arbitrales</span>
            </a>

            <a href="#" data-section="plays">
                <span class="nav-icon">📋</span>
                <span>Jugadas</span>
            </a>

            <a href="#" data-section="stats">
                <span class="nav-icon">📈</span>
                <span>Estadísticas</span>
            </a>

            <a href="#" data-section="settings">
                <span class="nav-icon">⚙</span>
                <span>Sistema</span>
            </a>
        </nav>

        <div class="sidebar-footer">

            <a href="{{ url('/dashboard') }}" class="sidebar-app-link">
                ← Ir a la aplicación
            </a>

            <div class="sidebar-user" id="sidebarUser">
                <div class="user-avatar" id="sidebarAvatar">A</div>

                <div class="user-info">
                    <strong id="sidebarName">Admin</strong>
                    <span>Administrador</span>
                </div>
            </div>

            <button class="sidebar-logout" id="sidebarLogout">
                <span>🚪</span>
                <span>Cerrar sesión</span>
            </button>

        </div>
    </aside>

    <main class="admin-main">

        <div class="main-header">
            <h1 id="pageTitle">Resumen General</h1>

            <div class="header-meta">
                <span id="headerTime"></span>
            </div>
        </div>

        <div class="main-content" id="adminContent"></div>

    </main>

</div>

@endsection

@push('scripts')

<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>

<script src="{{ asset('assets/js/data/exercisesData.js') }}"></script>
<script src="{{ asset('assets/js/data/signalsData.js') }}"></script>
<script src="{{ asset('assets/js/data/playsData.js') }}"></script>

<script src="{{ asset('assets/js/auth.js') }}"></script>
<script src="{{ asset('assets/js/admin.js') }}"></script>

@endpush