<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\RoutineExercise;
use App\Models\Category;


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
public function category()
{
    return $this->belongsTo(
        Category::class,
        'category_id'
    );
}

}