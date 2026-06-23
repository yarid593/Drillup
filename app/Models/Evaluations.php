<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\User;
use App\Models\Exercise;
use App\Models\MovementMetric;
use App\Models\EvaluationVideo;

class Evaluations extends Model
{
    protected $table = 'evaluations';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'exercise_id',
        'score',
        'observaciones',
        'evaluated_at'
    ];

    protected $casts = [
        'score' => 'float',
        'evaluated_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function exercise()
    {
        return $this->belongsTo(
            Exercise::class,
            'exercise_id'
        );
    }

    public function movementMetric()
    {
        return $this->hasOne(
            MovementMetric::class,
            'evaluation_id'
        );
    }

    public function video()
    {
        return $this->hasOne(
            EvaluationVideo::class,
            'evaluation_id'
        );
    }
}