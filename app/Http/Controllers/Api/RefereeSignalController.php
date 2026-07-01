<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RefereeSignal;
use Illuminate\Http\Request;

class RefereeSignalController extends Controller
{
    public function index()
{
    return RefereeSignal::where('is_active', true)
        ->orderBy('display_order')
        ->get();
}

    public function store(Request $request)
    {
        $request->validate([
    'name' => 'required|string|max:150',

    'slug' => 'required|string|max:150|unique:referee_signals,slug',

    'category' => 'required|string|max:100',

    'hand' => 'nullable|string|max:50',

    'description' => 'nullable|string',

    'interpretation' => 'nullable|string',

    'rule' => 'nullable|string',

    'image_url' => 'nullable|string|max:300',

    'animation_url' => 'nullable|string|max:255',

    'display_order' => 'nullable|integer',

    'is_active' => 'nullable|boolean',
]);

        $signal = RefereeSignal::create([
    'name' => $request->name,
    'slug' => $request->slug,
    'category' => $request->category,
    'hand' => $request->hand,

    'description' => $request->description,
    'interpretation' => $request->interpretation,
    'rule' => $request->rule,

    'image_url' => $request->image_url,
    'animation_url' => $request->animation_url,

    'display_order' => $request->display_order ?? 0,

    'is_active' => $request->boolean('is_active', true),
]);

        return response()->json($signal, 201);
    }

    public function show(string $id)
    {
        return RefereeSignal::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $signal = RefereeSignal::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|max:50'
        ]);

        $signal->update($request->all());

        return response()->json($signal);
    }

    public function destroy(string $id)
    {
        $signal = RefereeSignal::findOrFail($id);

        $signal->delete();

        return response()->json([
            'message' => 'Señal arbitral eliminada'
        ]);
    }
}