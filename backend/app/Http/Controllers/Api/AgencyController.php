<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AgencyController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Agency::query();

        if ($request->has('city')) {
            $query->where('city', $request->city);
        }

        if ($request->input('active_only', true)) {
            $query->where('is_active', true);
        }

        $agencies = $query->paginate($request->input('limit', 50));

        return $this->paginatedResponse($agencies->map(fn($agency) => [
            'id' => $agency->id,
            'name' => $agency->name,
            'city' => $agency->city,
            'contact_phone' => $agency->contact_phone,
            'contact_email' => $agency->contact_email,
            'thread_count' => $agency->threads()->count(),
            'created_at' => $agency->created_at,
        ]));
    }

    public function store(Request $request)
    {
        $this->authorize('isAdmin', auth()->user());

        $validated = $request->validate([
            'name' => 'required|string|unique:agencies,name',
            'city' => 'required|string',
            'godown_address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email',
        ]);

        $agency = Agency::create($validated);

        return $this->successResponse([
            'id' => $agency->id,
            'name' => $agency->name,
            'city' => $agency->city,
        ], 'Agency created successfully', 201);
    }

    public function show($id)
    {
        $agency = Agency::findOrFail($id);

        return $this->successResponse([
            'id' => $agency->id,
            'name' => $agency->name,
            'city' => $agency->city,
            'godown_address' => $agency->godown_address,
            'contact_phone' => $agency->contact_phone,
            'contact_email' => $agency->contact_email,
            'thread_count' => $agency->threads()->count(),
            'created_at' => $agency->created_at,
        ]);
    }

    public function update(Request $request, $id)
    {
        $this->authorize('isAdmin', auth()->user());

        $agency = Agency::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|unique:agencies,name,' . $id,
            'city' => 'nullable|string',
            'godown_address' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email',
            'is_active' => 'nullable|boolean',
        ]);

        $agency->update($validated);

        return $this->successResponse(null, 'Agency updated successfully');
    }

    public function destroy($id)
    {
        $this->authorize('isAdmin', auth()->user());

        $agency = Agency::findOrFail($id);
        $agency->update(['is_active' => false]);

        return $this->successResponse(null, 'Agency deactivated successfully');
    }
}
