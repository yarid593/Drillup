<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Play extends Model
{
    protected $table = 'plays';

    public $timestamps = false;

    protected $fillable = [
    'name',
    'slug',
    'description',
    'type',
    'animation_url',
    'image_url',
    'steps_json',
    'display_order',
    'is_active'
];
}