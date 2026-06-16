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
        'user_id' => 'required|exists:users,id',
        'routine_id' => 'required|exists:routines,id',
        'status' => 'required',
    ]);

        $userRoutine = UserRoutine::create($request->all());

        return response()->json($userRoutine, 201);
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
          $request->validate([
    'user_id' => 'sometimes|exists:users,id',
    'routine_id' => 'sometimes|exists:routines,id',
      ]);
        $userRoutine = UserRoutine::findOrFail($id);

        $userRoutine->update($request->all());

        return response()->json($userRoutine);
    }

    public function destroy(string $id)
    {
        return response()->json([
            'message' => 'No se permite eliminar historiales de rutinas'
        ], 403);
    }
}