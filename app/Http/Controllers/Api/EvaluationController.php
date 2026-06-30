<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluations;
use Illuminate\Http\Request;
use App\Models\Statistics;

class EvaluationController extends Controller
{
    public function index(Request $request)
{
    $query = Evaluations::with([
        'user',
        'exercise.category',
        'movementMetric',
        'video'
    ]);

    if ($request->user()->role !== 'admin') {
        $query->where('user_id', $request->user()->id);
    }

    return $query
       ->orderBy('evaluated_at')
      ->get();
}
    public function store(Request $request)
{
    $request->validate([
        'exercise_id' => 'required|exists:exercises,id',
        'score' => 'required|numeric|min:0|max:100',
        'observaciones' => 'required|string',
        'evaluated_at' => 'required|date'
    ]);

    $evaluation = Evaluations::create([
    'user_id' => $request->user()->id,
    'exercise_id' => $request->exercise_id,
    'score' => $request->score,
    'observaciones' => $request->observaciones,
    'evaluated_at' => $request->evaluated_at
]);

    $statistic = Statistics::where(
        'user_id',
        $request->user()->id
    )->first();

    $statistic->completed_evaluations += 1;

    $averageScore = Evaluations::where(
    'user_id',
    $request->user()->id
)->avg('score');

    $statistic->average_score = round(
        $averageScore,
        2
    );

    $statistic->save();

    return response()->json($evaluation, 201);
}

    public function show(Request $request, string $id)
{
    $evaluation = Evaluations::with(
        'user',
        'exercise'
    )->findOrFail($id);

    if (
        $request->user()->role !== 'admin' &&
        $evaluation->user_id !== $request->user()->id
    ) {
        return response()->json([
            'message' => 'Acceso denegado'
        ], 403);
    }

    return $evaluation;
}

   public function update(Request $request, string $id)
{
    $evaluation = Evaluations::findOrFail($id);

    
    if (
        $request->user()->role !== 'admin' &&
        $evaluation->user_id !== $request->user()->id
    ) {
        return response()->json([
            'message' => 'Acceso denegado'
        ], 403);
    }

    $request->validate([
        'score' => 'sometimes|numeric|min:0|max:100',
        'observaciones' => 'sometimes|string'
    ]);

    $evaluation->update([
        'score' => $request->score ?? $evaluation->score,
        'observaciones' => $request->observaciones ?? $evaluation->observaciones
    ]);

    
    $statistic = Statistics::where(
        'user_id',
        $evaluation->user_id
    )->first();

    $statistic->average_score = round(
        Evaluations::where(
            'user_id',
            $evaluation->user_id
        )->avg('score'),
        2
    );

    $statistic->save();

    return response()->json($evaluation);
}
   public function destroy(string $id)
{
    return response()->json([
        'message' => 'No se permite eliminar evaluaciones'
    ], 403);
}
}