<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\User;
use App\Models\Routines;

class UserRoutine extends Model
{
    protected $table = 'user_routines';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'routine_id',
        'assignment_date',
        'status',
        'progress_percentage',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'assignment_date' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'progress_percentage' => 'float'
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function routine()
    {
        return $this->belongsTo(
            Routines::class,
            'routine_id'
        );
    }
}