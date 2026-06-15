<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluations;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index()
    {
        return Evaluations::with(
            'user',
            'exercise'
        )->get();
    }

    public function store(Request $request)
    {
          $request->validate([
      'user_id' => 'required|exists:users,id',
      'exercise_id' => 'required|exists:exercises,id',
      'score' => 'required|numeric|min:0|max:100'
    ]);

        $evaluation = Evaluations::create($request->all());

        return response()->json($evaluation, 201);
    }

    public function show(string $id)
    {
        return Evaluations::with(
            'user',
            'exercise'
        )->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $evaluation = Evaluations::findOrFail($id);

          $request->validate([
      'user_id' => 'sometimes|exists:users,id',
      'exercise_id' => 'sometimes|exists:exercises,id',
      'score' => 'sometimes|numeric|min:0|max:100'
    ]);

        $evaluation->update($request->all());

        return response()->json($evaluation);
    }

    public function destroy(string $id)
    {
        return response()->json([
            'message' => 'No se permite eliminar evaluaciones'
        ], 403);
    }
}