<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Statistics;

class StatisticController extends Controller
{
    public function index()
    {
        return Statistics::with('user')->get();
    }

    public function show(string $id)
    {
        return Statistics::with('user')
            ->findOrFail($id);
    }
}