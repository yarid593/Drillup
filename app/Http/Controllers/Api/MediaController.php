<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    
    public function index()
    {
        return Media::all();
    }

    
    public function store(Request $request)
    {
        $request->validate([
            'exercise_id' => 'required|integer',
            'titulo' => 'required|max:100',
            'url' => 'required|max:255',
            'media_type' => 'required|max:20'
        ]);

        $media = Media::create($request->all());

        return response()->json($media, 201);
    }

    
    public function show(string $id)
    {
        return Media::findOrFail($id);
    }

    
    public function update(Request $request, string $id)
    {
        $media = Media::findOrFail($id);

        $request->validate([
            'exercise_id' => 'required|integer',
            'titulo' => 'required|max:100',
            'url' => 'required|max:255',
            'media_type' => 'required|max:20'
        ]);

        $media->update($request->all());

        return response()->json($media);
    }

    public function destroy(string $id)
    {
        $media = Media::findOrFail($id);

        $media->delete();

        return response()->json([
            'message' => 'Media eliminada correctamente'
        ]);
    }
}