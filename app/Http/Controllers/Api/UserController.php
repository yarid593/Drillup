<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
{
    return User::where('is_active', true)->get();
}

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),

            'role' => $request->role ?? 'user',
            'is_premium' => $request->is_premium ?? false,
            'is_active' => $request->is_active ?? true,

            'feedback_style' => $request->feedback_style,
            'notifications_enabled' => $request->notifications_enabled ?? true,
            'training_reminder_hour' => $request->training_reminder_hour,
            'birth_date' => $request->birth_date
        ]);

        return response()->json($user, 201);
    }

    public function show(string $id)
    {
        return User::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $user->update($request->except('password'));

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        return response()->json($user);
    }

    public function destroy(string $id)
{
    $user = User::findOrFail($id);

    $user->is_active = false;
    $user->save();

    return response()->json([
        'message' => 'Usuario deshabilitado'
    ]);
}
}