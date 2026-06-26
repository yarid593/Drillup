<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvaluationVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Services\AiAnalysisService;
use App\Models\Evaluations;
use App\Models\MovementMetric;
use App\Models\Statistics;

class EvaluationVideoController extends Controller
{

    protected AiAnalysisService $ai;

    public function __construct(AiAnalysisService $ai)
{
    $this->ai = $ai;
}
    public function index(Request $request)
    {
        return EvaluationVideo::with([
            'exercise.category'
        ])
        ->where('user_id', $request->user()->id)
        ->orderByDesc('uploaded_at')
        ->get()
        ->map(function ($video) {

            return [
                'id' => $video->id,
                'name' => basename($video->video_path),
                'date' => optional($video->uploaded_at)->format('Y-m-d'),
                'category' => $video->exercise?->category?->name,
                'exercise' => $video->exercise?->name,
                'description' => $video->exercise?->description,
                'notes' => '',
                'video_path' => asset('storage/' . $video->video_path),
                'analysis_status' => $video->analysis_status
            ];
        });
    }

    public function store(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi,webm|max:51200',
            'exercise_id' => 'required|exists:exercises,id'
        ]);

        $path = $request->file('video')->store(
            'evaluation-videos',
            'public'
        );

        $video = EvaluationVideo::create([
            'evaluation_id' => null,
            'user_id' => $request->user()->id,
            'exercise_id' => $request->exercise_id,
            'video_path' => $path,
            'uploaded_at' => now(),
            'analysis_status' => 'pending'
        ]);

        $fullPath = storage_path(
    'app/public/' . $video->video_path
      );

      $response = $this->ai->analyze(
    $fullPath,
    $request->exercise_id
);

if (! $response->successful()) {

    $video->analysis_status = 'failed';
    $video->save();

    return response()->json([
        'message' => 'Error analizando el video',
        'error' => $response->json()
    ], 500);
}

$data = $response->json();

$video->analysis_status = 'completed';
$video->save();

$evaluation = Evaluations::create([
    'user_id' => $request->user()->id,
    'exercise_id' => $request->exercise_id,
    'score' => $data['score'],
    'observaciones' => implode("\n", $data['weaknesses']),
    'evaluated_at' => now()
]);

$video->evaluation_id = $evaluation->id;
$video->save();

MovementMetric::create([
    'evaluation_id' => $evaluation->id,
    'knee_angle' => $data['metrics']['Detección corporal'],
    'elbow_angle' => $data['metrics']['Seguimiento'],
    'speed' => $data['metrics']['Precisión'],
    'stability' => $data['metrics']['Estabilidad']
]);

$statistic = Statistics::firstOrCreate(
    ['user_id' => $request->user()->id],
    [
        'completed_evaluations' => 0,
        'average_score' => 0
    ]
);

$statistic->completed_evaluations++;

$statistic->average_score = round(
    Evaluations::where(
        'user_id',
        $request->user()->id
    )->avg('score'),
    2
);

$statistic->save();

return response()->json([
    'video' => $video,
    'evaluation' => $evaluation,
    'metrics' => $data['metrics']
], 201);
        
    }

    public function show(Request $request, string $id)
{
    $video = EvaluationVideo::with([
        'evaluation.movementMetric'
    ])
    ->where(
        'user_id',
        $request->user()->id
    )
    ->findOrFail($id);

    if (!$video->evaluation) {
        return response()->json([
            'message' => 'Este video aún no ha sido analizado.'
        ], 404);
    }

    $metric = $video->evaluation->movementMetric;

    return response()->json([

        'videoId' => $video->id,
        'videoName' => basename($video->video_path),
        'category' => $video->exercise?->category?->name,
        'date' => optional($video->uploaded_at)->format('Y-m-d'),

        'score' => $video->evaluation->score,

        'metrics' => [
            'Detección corporal' => $metric?->knee_angle ?? 0,
            'Seguimiento' => $metric?->elbow_angle ?? 0,
            'Estabilidad' => $metric?->stability ?? 0,
            'Precisión' => $metric?->speed ?? 0
        ],

        'strengths' => [
            'Análisis realizado correctamente.'
        ],

        'weaknesses' => [
            $video->evaluation->observaciones
        ],

        'exercises' => [
            'Continúa practicando este ejercicio.'
        ]
    ]);
}
    public function analyze(Request $request, string $id)
{
    $video = EvaluationVideo::where(
        'user_id',
        $request->user()->id
    )->findOrFail($id);

    $fullPath = storage_path(
        'app/public/' . $video->video_path
    );

    $response = $this->ai->analyze(
        $fullPath,
        $video->exercise_id
    );

    if (!$response->successful()) {
        return response()->json([
            'message' => 'Error al analizar el video.'
        ], 500);
    }

    $video->analysis_status = 'completed';
    $video->save();

    return response()->json($response->json());
}

    public function destroy(Request $request, string $id)
    {
        $video = EvaluationVideo::where(
            'user_id',
            $request->user()->id
        )->findOrFail($id);

        try {

            if (
                $video->video_path &&
                Storage::disk('public')->exists($video->video_path)
            ) {
                Storage::disk('public')->delete($video->video_path);
            }

        } catch (\Throwable $e) {

            Log::warning($e->getMessage());

        }

        $video->delete();

        return response()->json([
            'message' => 'Video eliminado correctamente'
        ]);
    }
}