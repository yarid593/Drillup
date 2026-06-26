<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiAnalysisService
{
    public function analyze(string $videoPath, int $exerciseId)
    {
        return Http::attach(
            'video',
            fopen($videoPath, 'r'),
            basename($videoPath)
        )->post(
            env('AI_API_URL') . '/analyze',
            [
                'exercise_id' => $exerciseId
            ]
        );
    }
}