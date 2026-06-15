<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RefereeSignal;
use Illuminate\Http\Request;

class RefereeSignalController extends Controller
{
    public function index()
    {
        return RefereeSignal::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:50'
        ]);

        $signal = RefereeSignal::create($request->all());

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