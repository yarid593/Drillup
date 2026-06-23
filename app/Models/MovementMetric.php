<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Evaluations;

class MovementMetric extends Model
{
    protected $table = 'movement_metrics';

    public $timestamps = false;

    protected $fillable = [
        'evaluation_id',
        'knee_angle',
        'elbow_angle',
        'speed',
        'stability'
    ];

    protected $casts = [
        'knee_angle' => 'float',
        'elbow_angle' => 'float',
        'speed' => 'float',
        'stability' => 'float'
    ];

    public function evaluation()
    {
        return $this->belongsTo(
            Evaluations::class,
            'evaluation_id'
        );
    }
}