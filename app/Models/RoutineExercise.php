<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Routine;
use App\Models\Exercise;

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
    return $this->belongsTo(
        Routines::class,
        'routine_id'
    );
}

public function exercise()
{
    return $this->belongsTo(
        Exercise::class,
        'exercise_id'
    );
}
}