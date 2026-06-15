<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Play;
use Illuminate\Http\Request;

class PlayController extends Controller
{
    public function index()
    {
        return Play::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:100',
            'type' => 'required|max:50'
        ]);

        $play = Play::create($request->all());

        return response()->json($play, 201);
    }

    public function show(string $id)
    {
        return Play::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $play = Play::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|max:100',
            'type' => 'sometimes|max:50'
        ]);

        $play->update($request->all());

        return response()->json($play);
    }

    public function destroy(string $id)
    {
        $play = Play::findOrFail($id);

        $play->delete();

        return response()->json([
            'message' => 'Jugada eliminada'
        ]);
    }
}