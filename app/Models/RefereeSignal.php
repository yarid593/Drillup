<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RefereeSignal extends Model
{
    protected $table = 'referee_signals';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'description',
        'image_url',
        'animation_url'
    ];
}