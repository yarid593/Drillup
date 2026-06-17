<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiomechanicalRule extends Model
{
    protected $table = 'biomechanical_rules';

    protected $fillable = [
        'exercise_id',
        'knee_angle_min',
        'knee_angle_max',
        'elbow_angle_min',
        'elbow_angle_max',
        'speed_min',
        'stability_min'
    ];

    public function exercise()
    {
        return $this->belongsTo(
            Exercise::class,
            'exercise_id'
        );
    }
}