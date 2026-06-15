<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
{
    return Category::with(
        'routines',
        'exercises'
    )
    ->orderBy('display_order')
    ->get();
}

    public function store(Request $request)
{
    $request->validate([
        'name' => 'required|max:100',
        'slug' => 'required|max:100|unique:categories,slug',
    ]);

    $category = Category::create($request->all());

    return response()->json($category, 201);
}

    public function show(string $id)
    {
        return Category::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'required|max:100',
            'slug' => 'required|max:100|unique:categories,slug,' . $id,
        ]);

        $category->update($request->all());

        return response()->json($category);
    }

    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);

        $category->delete();

        return response()->json([
            'message' => 'Categoría eliminada'
        ]);
    }
}