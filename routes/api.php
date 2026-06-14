<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExerciseController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\RoutinesController;
use App\Http\Controllers\Api\RoutineExerciseController;

Route::apiResource('routine-exercises', RoutineExerciseController::class);
Route::apiResource('media', MediaController::class);
Route::apiResource('exercises', ExerciseController::class);
Route::apiResource('categories', CategoryController::class);
Route::apiResource('routines', RoutinesController::class);