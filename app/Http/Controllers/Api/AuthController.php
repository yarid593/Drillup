<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Statistics;
use App\Models\Streak;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Illuminate\Support\Str;

class AuthController extends Controller
{
     protected FirebaseAuth $firebase;

    public function __construct(FirebaseAuth $firebase)
    {
        $this->firebase = $firebase;
    }


   public function firebase(Request $request)
{
    $request->validate([
        'idToken' => 'required|string'
    ]);

    try {

        $verifiedToken = $this->firebase->verifyIdToken($request->idToken);

        return response()->json([
    'step' => 1
]);

        $uid = $verifiedToken->claims()->get('sub');

        $firebaseUser = $this->firebase->getUser($uid);

        $user = User::where('email', $firebaseUser->email)->first();

        if (!$user) {

            $user = User::create([
                'name' => $firebaseUser->displayName ?? 'Usuario',
                'email' => $firebaseUser->email,
                'password' => Hash::make(Str::random(40)),
                'role' => 'user',
                'is_active' => true
            ]);

            Statistics::create([
                'user_id' => $user->id,
                'completed_exercises' => 0,
                'training_time_minutes' => 0,
                'total_points' => 0,
                'completed_evaluations' => 0,
                'average_score' => 0
            ]);

            Streak::create([
                'user_id' => $user->id,
                'current_streak' => 0,
                'longest_streak' => 0,
                'last_workout_date' => null
            ]);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);

    } catch (\Throwable $e) {

        return response()->json([
            'message' => $e->getMessage()
        ], 500);

    }
}

    public function register(Request $request)
{
    $request->validate([
        'name' => 'required|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:6'
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => 'user',
        'is_active' => true
    ]);

    Statistics::create([
        'user_id' => $user->id,
        'completed_exercises' => 0,
        'training_time_minutes' => 0,
        'total_points' => 0,
        'completed_evaluations' => 0,
        'average_score' => 0
    ]);

    Streak::create([
        'user_id' => $user->id,
        'current_streak' => 0,
        'longest_streak' => 0,
        'last_workout_date' => null
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token
    ], 201);
}

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where(
            'email',
            $request->email
        )->first();

        if ($user && !$user->is_active) {
    return response()->json([
        'message' => 'Usuario deshabilitado'
    ], 403);
}

        if (
            !$user ||
            !Hash::check(
                $request->password,
                $user->password
            )
        ) {
            return response()->json([
                'message' => 'Credenciales inválidas'
            ], 401);
        }

       $user->tokens()->delete();

       $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'message' => 'Sesión cerrada'
        ]);
    }
}

