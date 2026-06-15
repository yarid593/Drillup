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
use App\Http\Controllers\Api\StatisticController;
use App\Http\Controllers\Api\StreakController;
use App\Http\Controllers\Api\PlayController;
use App\Http\Controllers\Api\RefereeSignalController;
/* Rutas publicas */
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

/* Para los usuarios ya autenticados */

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/profile', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    
    Route::get('/exercises', [ExerciseController::class, 'index']);
    Route::get('/exercises/{id}', [ExerciseController::class, 'show']);

   
    Route::get('/media', [MediaController::class, 'index']);
    Route::get('/media/{id}', [MediaController::class, 'show']);

    
    Route::get('/routines', [RoutinesController::class, 'index']);
    Route::get('/routines/{id}', [RoutinesController::class, 'show']);

    
    Route::get('/plays', [PlayController::class, 'index']);
    Route::get('/plays/{id}', [PlayController::class, 'show']);

   
    Route::get('/referee-signals', [RefereeSignalController::class, 'index']);
    Route::get('/referee-signals/{id}', [RefereeSignalController::class, 'show']);

   
    Route::get('/statistics', [StatisticController::class, 'index']);
    

    
    Route::get('/streaks', [StreakController::class, 'index']);
    
});
/* Rutas para admins, para evitar que cualquier usuario o visitante pueda eliminar, crear o actualizar cosas */

Route::middleware([
    'auth:sanctum',
    'admin'
])->group(function () {

    // Categories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Exercises
    Route::post('/exercises', [ExerciseController::class, 'store']);
    Route::put('/exercises/{id}', [ExerciseController::class, 'update']);
    Route::delete('/exercises/{id}', [ExerciseController::class, 'destroy']);

    // Media
    Route::post('/media', [MediaController::class, 'store']);
    Route::put('/media/{id}', [MediaController::class, 'update']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);

    // Routines
    Route::post('/routines', [RoutinesController::class, 'store']);
    Route::put('/routines/{id}', [RoutinesController::class, 'update']);
    Route::delete('/routines/{id}', [RoutinesController::class, 'destroy']);

    // Plays
    Route::post('/plays', [PlayController::class, 'store']);
    Route::put('/plays/{id}', [PlayController::class, 'update']);
    Route::delete('/plays/{id}', [PlayController::class, 'destroy']);

    // Referee Signals
    Route::post('/referee-signals', [RefereeSignalController::class, 'store']);
    Route::put('/referee-signals/{id}', [RefereeSignalController::class, 'update']);
    Route::delete('/referee-signals/{id}', [RefereeSignalController::class, 'destroy']);

    // Usuarios
     Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);

    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);

   Route::delete('/users/{id}', [
    UserController::class,
    'destroy'
]);

    Route::apiResource('routine-exercises', RoutineExerciseController::class);
});

/* Otras funcionalidades */
Route::middleware('auth:sanctum')->group(function () {

    Route::apiResource('user-routines', UserRoutineController::class);

    Route::apiResource('workout-logs', WorkoutLogController::class);

    Route::apiResource('evaluations', EvaluationController::class);

    Route::apiResource('movement-metrics', MovementMetricController::class);

});