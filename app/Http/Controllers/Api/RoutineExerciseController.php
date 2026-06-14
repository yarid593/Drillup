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
            'routine_id' => 'required|integer',
            'exercise_id' => 'required|integer'
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