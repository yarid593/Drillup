<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Play;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlayController extends Controller
{
    public function index()
{
    return Play::where('is_active', true)
        ->orderBy('display_order')
        ->get();
}

    public function store(Request $request)
    {
        $request->validate([
    'name' => 'required|string|max:100',
    'slug' => 'required|string|max:100|unique:plays,slug',
    'description' => 'nullable|string',
    'type' => 'required|string|max:50',

    'animation_url' => 'nullable|string|max:255',
    'image_url' => 'nullable|string|max:300',

    'steps_json' => 'nullable|array',

    'display_order' => 'nullable|integer',

    'is_active' => 'nullable|boolean',
]);

        $play = Play::create([
    'name' => $request->name,
    'slug' => $request->slug,
    'description' => $request->description,
    'type' => $request->type,

    'animation_url' => $request->animation_url,
    'image_url' => $request->image_url,

    'steps_json' => $request->steps_json,

    'display_order' => $request->display_order ?? 0,

    'is_active' => $request->boolean('is_active', true),
]);

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
    'name' => 'sometimes|string|max:100',

    'slug' => [
        'sometimes',
        'string',
        'max:100',
        Rule::unique('plays')->ignore($play->id),
    ],

    'description' => 'nullable|string',

    'type' => 'sometimes|string|max:50',

    'animation_url' => 'nullable|string|max:255',

    'image_url' => 'nullable|string|max:300',

    'steps_json' => 'nullable|array',

    'display_order' => 'nullable|integer',

    'is_active' => 'nullable|boolean',
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