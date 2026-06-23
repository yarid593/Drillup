<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Exercise;

class Media extends Model
{
    protected $table = 'media';

    public $timestamps = false;

    protected $fillable = [
        'exercise_id',
        'titulo',
        'url',
        'media_type'
    ];

    public function exercise()
    {
        return $this->belongsTo(
            Exercise::class,
            'exercise_id'
        );
    }
}