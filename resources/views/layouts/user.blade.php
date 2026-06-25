@extends('layouts.app')

@section('body-class', 'dashboard-page')

@section('content')

<div class="dashboard-layout">

    @include('partials.user.sidebar')

    <main class="dashboard-content">

        @include('partials.user.header')

        <section class="page-content">

            @yield('page-content')

        </section>

    </main>

</div>

@endsection