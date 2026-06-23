<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use App\Models\UserRoutine;
use App\Models\WorkoutLog;
use App\Models\Evaluations;
use App\Models\Statistics;
use App\Models\Streak;
use App\Models\EvaluationVideo;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'birth_date',
        'gender',
        'height_cm',
        'weight_kg',
        'is_premium',
        'is_active',
        'feedback_style',
        'notifications_enabled',
        'training_reminder_hour'
    ];

    protected $hidden = [
        'password'
    ];

    protected function casts(): array
    {
        return [
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
            'notifications_enabled' => 'boolean',

            'birth_date' => 'date',

            'height_cm' => 'float',
            'weight_kg' => 'float',

            'created_at' => 'datetime',
            'updated_at' => 'datetime'
        ];
    }

    public function userRoutines()
    {
        return $this->hasMany(
            UserRoutine::class,
            'user_id'
        );
    }

    public function workoutLogs()
    {
        return $this->hasMany(
            WorkoutLog::class,
            'user_id'
        );
    }

    public function evaluations()
    {
        return $this->hasMany(
            Evaluations::class,
            'user_id'
        );
    }

    public function statistic()
    {
        return $this->hasOne(
            Statistics::class,
            'user_id'
        );
    }

    public function streak()
    {
        return $this->hasOne(
            Streak::class,
            'user_id'
        );
    }

    public function evaluationVideos()
    {
        return $this->hasMany(
            EvaluationVideo::class,
            'user_id'
        );
    }
}