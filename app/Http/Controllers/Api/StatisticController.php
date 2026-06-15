<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Statistics;
use Illuminate\Http\Request;

class StatisticController extends Controller
{
    public function index(Request $request)
    {
        return Statistics::with('user')
            ->where(
                'user_id',
                $request->user()->id
            )
            ->first();
    }

    
}