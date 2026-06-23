<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Category;
use App\Models\RoutineExercise;
use App\Models\UserRoutine;
use App\Models\WorkoutLog;

class Routines extends Model
{
    protected $table = 'routines';

    public $timestamps = false;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'image_url',
        'goal',
        'is_premium',
        'is_active',
        'duration_minutes',
        'display_order'
    ];

    protected $casts = [
        'is_premium' => 'boolean',
        'is_active' => 'boolean'
    ];

    public function category()
    {
        return $this->belongsTo(
            Category::class,
            'category_id'
        );
    }

    public function routineExercises()
    {
        return $this->hasMany(
            RoutineExercise::class,
            'routine_id'
        );
    }

    public function userRoutines()
    {
        return $this->hasMany(
            UserRoutine::class,
            'routine_id'
        );
    }

    public function workoutLogs()
    {
        return $this->hasMany(
            WorkoutLog::class,
            'routine_id'
        );
    }
}