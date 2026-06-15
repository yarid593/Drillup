<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MovementMetric;
use Illuminate\Http\Request;

class MovementMetricController extends Controller
{
    public function index()
    {
        return MovementMetric::with(
            'evaluation'
        )->get();
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
        $movementMetric = MovementMetric::create(
            $request->all()
        );

        return response()->json(
            $movementMetric,
            201
        );
    }

    public function show(string $id)
    {
        return MovementMetric::with(
            'evaluation'
        )->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $movementMetric = MovementMetric::findOrFail($id);

          $request->validate([
      'evaluation_id' => 'sometimes|exists:evaluations,id',

      'knee_angle' => 'sometimes|numeric|min:0|max:180',
      'elbow_angle' => 'sometimes|numeric|min:0|max:180',

      'speed' => 'sometimes|numeric|min:0|max:100',
      'stability' => 'sometimes|numeric|min:0|max:100'
    ]);

        $movementMetric->update(
            $request->all()
        );

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