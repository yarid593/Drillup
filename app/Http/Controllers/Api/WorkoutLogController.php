<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkoutLog;
use Illuminate\Http\Request;
use App\Models\Statistics;
use App\Models\Streak;
use Carbon\Carbon;

class WorkoutLogController extends Controller
{
    public function index()
    {
        return WorkoutLog::with(
            'user',
            'routine'
        )->get();
    }

   public function store(Request $request)
{
    $request->validate([
        'user_id' => 'required|exists:users,id',
        'routine_id' => 'required|exists:routines,id',
        'duration_minutes' => 'required|integer|min:1',
        'exercises_done' => 'required|integer|min:0',
        'completion_pct' => 'required|numeric|min:0|max:100'
    ]);

    $workoutLog = WorkoutLog::create($request->all());

    $statistic = Statistics::where(
        'user_id',
        $request->user_id
    )->first();

    $statistic->completed_exercises += $request->exercises_done;
    $statistic->training_time_minutes += $request->duration_minutes;
    $statistic->total_points += ($request->exercises_done * 10);

    $statistic->save();

    $streak = Streak::where(
        'user_id',
        $request->user_id
    )->first();

    $today = Carbon::today();

    if ($streak->last_workout_date === null) {

        $streak->current_streak = 1;

    } else {

        $lastWorkout = Carbon::parse(
            $streak->last_workout_date
        );

        $daysDifference = $lastWorkout->diffInDays($today);

        if ($daysDifference == 1) {

            $streak->current_streak++;

        } elseif ($daysDifference > 1) {

            $streak->current_streak = 1;
        }
    }

    if (
        $streak->current_streak >
        $streak->longest_streak
    ) {
        $streak->longest_streak =
            $streak->current_streak;
    }

    $streak->last_workout_date = $today;
    $streak->save();

    return response()->json($workoutLog, 201);
}

    public function show(string $id)
    {
        return WorkoutLog::with(
            'user',
            'routine'
        )->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
    'user_id' => 'sometimes|exists:users,id',
    'routine_id' => 'sometimes|exists:routines,id',
    'duration_minutes' => 'sometimes|integer|min:1',
    'exercises_done' => 'sometimes|integer|min:0',
    'completion_pct' => 'sometimes|numeric|min:0|max:100'
    ]);

        $workoutLog = WorkoutLog::findOrFail($id);

        $workoutLog->update($request->all());

        return response()->json($workoutLog);
    }

    public function destroy(string $id)
    {
        return response()->json([
            'message' => 'No se permite eliminar historiales de entrenamiento'
        ], 403);
    }
}