<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoutineExercise extends Model
{
    protected $table = 'routine_exercises';

    public $timestamps = false;

    protected $fillable = [
        'routine_id',
        'exercise_id',
        'display_order',
        'duration_secs',
        'reps',
        'sets',
        'rest_secs'
    ];
    public function routine()
{
    return $this->belongsTo(Routines::class);
}

public function exercise()
{
    return $this->belongsTo(Exercise::class);
}
}