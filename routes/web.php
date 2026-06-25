<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'auth.login');

Route::view('/login', 'auth.login');

Route::view('/register', 'auth.register');

Route::view('/dashboard', 'user.dashboard');

Route::view('/profile', 'user.profile');

Route::view('/exercises', 'user.exercises');

Route::view('/statistics', 'user.statistics');

Route::view('/videos', 'user.videos');

Route::view('/plays', 'user.plays');

Route::view('/signals', 'user.signals');

Route::view('/evaluations', 'user.evaluations');

Route::view('/admin', 'admin.dashboard');