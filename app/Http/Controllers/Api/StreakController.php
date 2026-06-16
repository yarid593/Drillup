<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Streak;
use Illuminate\Http\Request;

class StreakController extends Controller
{
    public function index(Request $request)
{
    if ($request->user()->role === 'admin') {

        return Streak::with('user')->get();
    }

    return Streak::with('user')
        ->where(
            'user_id',
           $request->user()->id
        )
        ->first();
}

    
}