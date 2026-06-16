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
    if ($request->user()->role === 'admin') {

        return Evaluations::with(
            'user',
            'exercise'
        )->get();
    }

    return Evaluations::with(
        'user',
        'exercise'
    )
    ->where(
        'user_id',
        $request->user()->id
    )
    ->get();
}
    public function store(Request $request)
{
    $request->validate([
        'user_id' => 'required|exists:users,id',
        'exercise_id' => 'required|exists:exercises,id',
        'score' => 'required|numeric|min:0|max:100',
        'observaciones' => 'required|string',
        'evaluated_at' => 'required|date'
    ]);

    $evaluation = Evaluations::create($request->all());

    $statistic = Statistics::where(
        'user_id',
        $request->user_id
    )->first();

    $statistic->completed_evaluations += 1;

    $averageScore = Evaluations::where(
        'user_id',
        $request->user_id
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

    $request->validate([
        'user_id' => 'sometimes|exists:users,id',
        'exercise_id' => 'sometimes|exists:exercises,id',
        'score' => 'sometimes|numeric|min:0|max:100'
    ]);

    $evaluation->update($request->all());

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
    $evaluation = Evaluations::findOrFail($id);

    $userId = $evaluation->user_id;

    $evaluation->delete();

    $statistic = Statistics::where(
        'user_id',
        $userId
    )->first();

    $statistic->completed_evaluations = Evaluations::where(
        'user_id',
        $userId
    )->count();

    $statistic->average_score = Evaluations::where(
        'user_id',
        $userId
    )->avg('score') ?? 0;

    $statistic->save();

    return response()->json([
        'message' => 'Evaluación eliminada'
    ]);
}
}