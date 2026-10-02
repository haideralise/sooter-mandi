<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ThreadController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Thread::with(['agency']);

        if ($request->has('agency_id')) {
            $query->where('agency_id', $request->agency_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // boolean() rather than input(): a query string carries "false" as a
        // string, which is truthy in PHP, so active_only=false was ignored and
        // deactivated threads could never be listed again.
        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        $threads = $query->paginate($request->input('limit', 50));

        $threads->setCollection($threads->getCollection()->map(function ($thread) {
            $latestRate = $thread->getLatestRate();

            return [
                'id' => $thread->id,
                'agency_id' => $thread->agency_id,
                'agency_name' => $thread->agency?->name,
                'type' => $thread->type,
                'color' => $thread->color,
                'packaging_type' => $thread->packaging_type,
                'weight' => $thread->weight_value . $thread->weight_unit,
                'weight_value' => $thread->weight_value,
                'weight_unit' => $thread->weight_unit,
                'description' => $thread->description,
                'is_active' => $thread->is_active,
                'current_price' => $latestRate?->price_pkr ?? 0,
                'last_updated' => $latestRate?->updated_at,
            ];
        }));

        return $this->paginatedResponse($threads);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'agency_id' => 'required|exists:agencies,id',
            'type' => 'required|string',
            'color' => 'required|string',
            'packaging_type' => 'required|in:Carton,Bag',
            'weight_value' => 'nullable|numeric|min:0',
            'weight_unit' => 'nullable|in:lbs,kg,g',
            'description' => 'nullable|string',
        ]);

        $thread = Thread::create($validated);

        return $this->successResponse([
            'id' => $thread->id,
            'type' => $thread->type,
            'color' => $thread->color,
        ], 'Thread created successfully', 201);
    }

    public function show($id)
    {
        $thread = Thread::with('agency')->findOrFail($id);
        $latestRate = $thread->getLatestRate();

        return $this->successResponse([
            'id' => $thread->id,
            'agency_id' => $thread->agency_id,
            'agency_name' => $thread->agency->name,
            'type' => $thread->type,
            'color' => $thread->color,
            'packaging_type' => $thread->packaging_type,
            'weight' => $thread->weight_value . $thread->weight_unit,
            'description' => $thread->description,
            'current_price' => $latestRate?->price_pkr ?? 0,
            'last_updated' => $latestRate?->updated_at,
            'created_at' => $thread->created_at,
        ]);
    }

    public function update(Request $request, $id)
    {
        $thread = Thread::findOrFail($id);

        $validated = $request->validate([
            'type' => 'nullable|string',
            'color' => 'nullable|string',
            'packaging_type' => 'nullable|in:Carton,Bag',
            'weight_value' => 'nullable|numeric|min:0',
            'weight_unit' => 'nullable|in:lbs,kg,g',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $thread->update($validated);

        return $this->successResponse(null, 'Thread updated successfully');
    }
}
