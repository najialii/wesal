<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CategoryController extends Controller
{
    use AuthorizesRequests;
    
    public function __construct()
    {
        // Authorization handled by policies
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $categories = Category::when($request->get('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%");
            })
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($request->get('per_page', 15));

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['sort_order'] = $validated['sort_order'] ?? Category::max('sort_order') + 1;

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category
        ], 201);
    }

    public function show($categoryId): JsonResponse
    {
        $category = Category::findOrFail($categoryId);
        $this->authorize('view', $category);
        
        return response()->json($category->loadCount('products'));
    }

    public function update(Request $request, $categoryId): JsonResponse
    {
        $category = Category::findOrFail($categoryId);
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category->fresh()
        ]);
    }

    public function destroy($categoryId): JsonResponse
    {
        $category = Category::findOrFail($categoryId);
        $this->authorize('delete', $category);

        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with existing products'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }

    public function active(): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $categories = Category::active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }
}