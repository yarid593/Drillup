<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function index()
{
    return Exercise::where('is_active', true)
        ->orderBy('display_order')
        ->get();
}

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|integer',
            'name' => 'required|max:150',
            'slug' => 'required|max:150|unique:exercises,slug',
        ]);

        $exercise = Exercise::create($request->all());

        return response()->json($exercise, 201);
    }

    public function show(string $id)
    {
        return Exercise::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $exercise = Exercise::findOrFail($id);

        $request->validate([
            'category_id' => 'required|integer',
            'name' => 'required|max:150',
            'slug' => 'required|max:150|unique:exercises,slug,' . $id,
        ]);

        $exercise->update($request->all());

        return response()->json($exercise);
    }

    public function destroy(string $id)
{
    $exercise = Exercise::findOrFail($id);

    $exercise->is_active = false;
    $exercise->save();

    return response()->json([
        'message' => 'Ejercicio deshabilitado correctamente'
    ]);
}
}