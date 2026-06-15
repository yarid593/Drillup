<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Exercise;
use App\Models\Routine;

class Category extends Model
{
    protected $table = 'categories';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_url',
        'icon',
        'display_order'
    ];
   public function exercises()
{
    return $this->hasMany(
        Exercise::class,
        'category_id'
    );
}

public function routines()
{
    return $this->hasMany(
        Routines::class,
        'category_id'
    );
}
}