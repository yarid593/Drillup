<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MovementMetric;
use Illuminate\Http\Request;
use App\Models\Evaluations;

class MovementMetricController extends Controller
{
    public function index(Request $request)
{
    if ($request->user()->role === 'admin') {

        return MovementMetric::with(
            'evaluation'
        )->get();
    }

    return MovementMetric::whereHas(
        'evaluation',
        function ($query) use ($request) {
            $query->where(
                'user_id',
                $request->user()->id
            );
        }
    )
    ->with('evaluation')
    ->get();
}

    public function store(Request $request)
{
    $request->validate([
        'evaluation_id' => 'required|exists:evaluations,id',
        'knee_angle' => 'required|numeric|min:0|max:180',
        'elbow_angle' => 'required|numeric|min:0|max:180',
        'speed' => 'required|numeric|min:0|max:100',
        'stability' => 'required|numeric|min:0|max:100'
    ]);

   $evaluation = Evaluations::findOrFail(
    $request->evaluation_id
);

if (
    $request->user()->role !== 'admin' &&
    $evaluation->user_id !== $request->user()->id
) {
    return response()->json([
        'message' => 'Acceso denegado'
    ], 403);
}

if (
    MovementMetric::where(
        'evaluation_id',
        $request->evaluation_id
    )->exists()
) {
    return response()->json([
        'message' => 'La evaluación ya tiene métricas registradas'
    ], 409);
}
}

    public function show(Request $request, string $id)
{
    $movementMetric = MovementMetric::with(
        'evaluation'
    )->findOrFail($id);

    if (
        $request->user()->role !== 'admin' &&
        $movementMetric->evaluation->user_id !==
        $request->user()->id
    ) {
        return response()->json([
            'message' => 'Acceso denegado'
        ], 403);
    }

    return $movementMetric;
}

   public function update(Request $request, string $id)
{
    $movementMetric = MovementMetric::with(
        'evaluation'
    )->findOrFail($id);

    
    if (
        $request->user()->role !== 'admin' &&
        $movementMetric->evaluation->user_id !==
        $request->user()->id
    ) {
        return response()->json([
            'message' => 'Acceso denegado'
        ], 403);
    }

    $request->validate([
        'knee_angle' => 'sometimes|numeric|min:0|max:180',
        'elbow_angle' => 'sometimes|numeric|min:0|max:180',
        'speed' => 'sometimes|numeric|min:0|max:100',
        'stability' => 'sometimes|numeric|min:0|max:100'
    ]);

    
    $movementMetric->update([
        'knee_angle' => $request->knee_angle ?? $movementMetric->knee_angle,
        'elbow_angle' => $request->elbow_angle ?? $movementMetric->elbow_angle,
        'speed' => $request->speed ?? $movementMetric->speed,
        'stability' => $request->stability ?? $movementMetric->stability
    ]);

    return response()->json(
        $movementMetric
    );
}

    public function destroy(string $id)
    {
        return response()->json([
            'message' => 'No se permite eliminar métricas de evaluación'
        ], 403);
    }
}