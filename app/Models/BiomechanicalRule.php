<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Exercise;

class BiomechanicalRule extends Model
{
    protected $table = 'biomechanical_rules';

    public $timestamps = false;

    protected $fillable = [
        'exercise_id',
        'knee_angle_min',
        'knee_angle_max',
        'elbow_angle_min',
        'elbow_angle_max',
        'speed_min',
        'stability_min'
    ];

    protected $casts = [
        'knee_angle_min' => 'float',
        'knee_angle_max' => 'float',
        'elbow_angle_min' => 'float',
        'elbow_angle_max' => 'float',
        'speed_min' => 'float',
        'stability_min' => 'float'
    ];

    public function exercise()
    {
        return $this->belongsTo(
            Exercise::class,
            'exercise_id'
        );
    }
}