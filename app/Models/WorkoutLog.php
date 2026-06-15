<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutLog extends Model
{
    protected $table = 'workout_logs';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'routine_id',
        'completed_at',
        'duration_minutes',
        'exercises_done',
        'completion_pct',
        'notes'
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function routine()
    {
        return $this->belongsTo(
            Routines::class,
            'routine_id'
        );
    }
}