<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Streak extends Model
{
    protected $table = 'streaks';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'current_streak',
        'longest_streak',
        'last_workout_date',
        'updated_at'
    ];

    protected $casts = [
        'last_workout_date' => 'date',
        'updated_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }
}