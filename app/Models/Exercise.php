<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Category;
use App\Models\Media;
use App\Models\RoutineExercise;
use App\Models\Evaluations;
use App\Models\BiomechanicalRule;
use App\Models\EvaluationVideo;

class Exercise extends Model
{
    protected $table = 'exercises';

    public $timestamps = false;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'instructions',
        'tips',
        'muscles',
        'measure_type',
        'duration_secs',
        'reps',
        'sets',
        'image_url',
        'svg_animation',
        'is_active',
        'display_order'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function category()
    {
        return $this->belongsTo(
            Category::class,
            'category_id'
        );
    }

    public function media()
    {
        return $this->hasMany(
            Media::class,
            'exercise_id'
        );
    }

    public function routineExercises()
    {
        return $this->hasMany(
            RoutineExercise::class,
            'exercise_id'
        );
    }

    public function evaluations()
    {
        return $this->hasMany(
            Evaluations::class,
            'exercise_id'
        );
    }

    public function biomechanicalRule()
    {
        return $this->hasOne(
            BiomechanicalRule::class,
            'exercise_id'
        );
    }

    public function evaluationVideos()
    {
        return $this->hasMany(
            EvaluationVideo::class,
            'exercise_id'
        );
    }
}