<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluations extends Model
{
    protected $table = 'evaluations';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'exercise_id',
        'score',
        'observaciones',
        'evaluation_type',
        'evaluated_at'
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
    public function movementMetrics()
{
    return $this->hasOne(
        MovementMetric::class,
        'evaluation_id'
    );
}
}