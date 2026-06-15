<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Play extends Model
{
    protected $table = 'plays';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'description',
        'type',
        'animation_url'
    ];
}