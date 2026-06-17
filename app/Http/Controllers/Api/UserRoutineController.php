<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserRoutine;
use Illuminate\Http\Request;

class UserRoutineController extends Controller
{
    public function index(Request $request)
{
    if ($request->user()->role === 'admin') {

        return UserRoutine::with(
            'user',
            'routine'
        )->get();
    }

    return UserRoutine::with(
        'user',
        'routine'
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
        'routine_id' => 'required|exists:routines,id',
        'status' => 'required',
    ]);

    // Evita asignar la misma rutina varias veces
    if (
        UserRoutine::where(
            'user_id',
            $request->user()->id
        )
        ->where(
            'routine_id',
            $request->routine_id
        )
        ->exists()
    ) {
        return response()->json([
            'message' => 'La rutina ya está asignada al usuario'
        ], 409);
    }

    $userRoutine = UserRoutine::create([
        'user_id' => $request->user()->id,
        'routine_id' => $request->routine_id,
        'status' => $request->status
    ]);

    return response()->json(
        $userRoutine,
        201
    );
}

    public function show(Request $request, string $id)
{
    $userRoutine = UserRoutine::with(
        'user',
        'routine'
    )->findOrFail($id);

    if (
        $request->user()->role !== 'admin' &&
        $userRoutine->user_id !== $request->user()->id
    ) {
        return response()->json([
            'message' => 'Acceso denegado'
        ], 403);
    }

    return $userRoutine;
}

    public function update(Request $request, string $id)
{
    $userRoutine = UserRoutine::findOrFail($id);

    if (
        $request->user()->role !== 'admin' &&
        $userRoutine->user_id !== $request->user()->id
    ) {
        return response()->json([
            'message' => 'Acceso denegado'
        ], 403);
    }

    $request->validate([
        'routine_id' => 'sometimes|exists:routines,id',
        'status' => 'sometimes'
    ]);

    $userRoutine->update([
        'routine_id' => $request->routine_id ?? $userRoutine->routine_id,
        'status' => $request->status ?? $userRoutine->status
    ]);

    return response()->json($userRoutine);
}

    public function destroy(string $id)
    {
        return response()->json([
            'message' => 'No se permite eliminar historiales de rutinas'
        ], 403);
    }
}