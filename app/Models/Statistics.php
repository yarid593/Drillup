<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Statistics extends Model
{
    protected $table = 'statistics';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'completed_exercises',
        'training_time_minutes',
        'total_points',
        'completed_evaluations',
        'average_score'
    ];

    protected $casts = [
        'average_score' => 'float'
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }
}