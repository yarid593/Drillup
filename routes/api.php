<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExerciseController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\RoutinesController;
use App\Http\Controllers\Api\RoutineExerciseController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserRoutineController;
use App\Http\Controllers\Api\WorkoutLogController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\MovementMetricController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;

Route::middleware('auth:sanctum')
    ->get('/profile', function (Request $request) {
        return $request->user();
    });
Route::middleware('auth:sanctum')->group(function () {Route::post('logout', [AuthController::class,'logout']);});
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::apiResource('movement-metrics',MovementMetricController::class);
Route::apiResource('evaluations', EvaluationController::class);
Route::apiResource('workout-logs', WorkoutLogController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('routine-exercises', RoutineExerciseController::class);
Route::apiResource('media', MediaController::class);
Route::apiResource('exercises', ExerciseController::class);
Route::apiResource('categories', CategoryController::class);
Route::apiResource('routines', RoutinesController::class);
Route::apiResource('user-routines', UserRoutineController::class);