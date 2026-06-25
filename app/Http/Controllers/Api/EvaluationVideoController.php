<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvaluationVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EvaluationVideoController extends Controller
{
    public function index(Request $request)
    {
        return EvaluationVideo::with('exercise')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('uploaded_at')
            ->get();
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

        return response()->json($video, 201);
    }

    public function show(Request $request, string $id)
{
    return EvaluationVideo::where(
        'user_id',
        $request->user()->id
    )->findOrFail($id);
}

public function destroy(Request $request, string $id)
{
    $video = EvaluationVideo::where(
        'user_id',
        $request->user()->id
    )->findOrFail($id);

    if ($video->video_path) {
        Storage::disk('public')->delete($video->video_path);
    }

    $video->delete();

    return response()->json([
        'message' => 'Video eliminado correctamente'
    ]);
}
}