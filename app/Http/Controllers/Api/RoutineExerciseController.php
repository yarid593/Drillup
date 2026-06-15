<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoutineExercise;
use Illuminate\Http\Request;

class RoutineExerciseController extends Controller
{
    public function index()
    {
        return RoutineExercise::all();
    }

    public function store(Request $request)
    {
        $request->validate([
      'routine_id' => 'required|exists:routines,id',
      'exercise_id' => 'required|exists:exercises,id',
      'display_order' => 'required|integer|min:1'
    ]);

        $routineExercise = RoutineExercise::create($request->all());

        return response()->json($routineExercise, 201);
    }

    public function show(string $id)
    {
        return RoutineExercise::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
      'routine_id' => 'sometimes|exists:routines,id',
      'exercise_id' => 'sometimes|exists:exercises,id'
    ]);
        $routineExercise = RoutineExercise::findOrFail($id);

        $routineExercise->update($request->all());

        return response()->json($routineExercise);
    }

    public function destroy(string $id)
    {
        $routineExercise = RoutineExercise::findOrFail($id);

        $routineExercise->delete();

        return response()->json([
            'message' => 'Ejercicio de rutina eliminado'
        ]);
    }
}