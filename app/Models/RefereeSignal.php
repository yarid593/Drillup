<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RefereeSignal extends Model
{
    protected $table = 'referee_signals';

    public $timestamps = false;

    protected $fillable = [
    'name',
    'slug',
    'category',
    'hand',
    'description',
    'interpretation',
    'rule',
    'image_url',
    'animation_url',
    'display_order',
    'is_active'
];
protected $casts = [
    'is_active' => 'boolean',
];
}