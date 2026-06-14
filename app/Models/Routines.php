<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Routines extends Model
{
    protected $table = 'routines';

    public $timestamps = false;

    protected $fillable = [
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
    public function routineExercises()
{
    return $this->hasMany(RoutineExercise::class);
}
}