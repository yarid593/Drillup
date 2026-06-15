<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Streak;
use Illuminate\Http\Request;

class StreakController extends Controller
{
    public function index(Request $request)
    {
        return Streak::with('user')
            ->where(
                'user_id',
                $request->user()->id
            )
            ->first();
    }

    
}