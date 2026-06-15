<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Streak;

class StreakController extends Controller
{
    public function index()
    {
        return Streak::with('user')->get();
    }

    public function show(string $id)
    {
        return Streak::with('user')
            ->findOrFail($id);
    }
}