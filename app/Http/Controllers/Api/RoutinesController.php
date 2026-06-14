<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Routine;
use App\Models\Routines;
use Illuminate\Http\Request;

class RoutinesController extends Controller
{
    public function index()
    {
        return Routines::orderBy('display_order')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:200',
            'slug' => 'required|max:200|unique:routines,slug'
        ]);

        $routine = Routines::create($request->all());

        return response()->json($routine, 201);
    }

    public function show(string $id)
    {
        return Routines::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $routine = Routines::findOrFail($id);

        $request->validate([
            'name' => 'required|max:200',
            'slug' => 'required|max:200|unique:routines,slug,' . $id
        ]);

        $routine->update($request->all());

        return response()->json($routine);
    }

    public function destroy(string $id)
    {
        $routine = Routines::findOrFail($id);

        $routine->delete();

        return response()->json([
            'message' => 'Rutina eliminada'
        ]);
    }
}