<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationVideo extends Model
{
    protected $table = 'evaluation_videos';

    public $timestamps = false;

    protected $fillable = [
        'evaluation_id',
        'user_id',
        'exercise_id',
        'video_path',
        'uploaded_at'
    ];

    public function evaluation()
    {
        return $this->belongsTo(
            Evaluations::class,
            'evaluation_id'
        );
    }

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
}