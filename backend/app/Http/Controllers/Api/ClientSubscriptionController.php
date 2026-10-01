<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientSubscription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ClientSubscriptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $subscriptions = auth()->user()->subscriptions()
            ->with(['thread', 'agency'])
            ->where('is_active', true)
            ->paginate($request->input('limit', 50));

        return $this->paginatedResponse($subscriptions->map(fn($sub) => [
            'id' => $sub->id,
            'thread_id' => $sub->thread_id,
            'thread_name' => $sub->thread?->type . ' - ' . $sub->thread?->color,
            'agency_id' => $sub->agency_id,
            'agency_name' => $sub->agency?->name,
            'notification_type' => $sub->notification_type,
            'created_at' => $sub->created_at,
        ]));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'thread_id' => 'nullable|exists:threads,id',
            'agency_id' => 'nullable|exists:agencies,id',
            'notification_type' => 'required|in:All,Email,Push',
        ]);

        if (!$validated['thread_id'] && !$validated['agency_id']) {
            return $this->errorResponse('Either thread_id or agency_id is required', 422);
        }

        $existingSub = ClientSubscription::where('client_id', auth()->id())
            ->where('thread_id', $validated['thread_id'])
            ->where('agency_id', $validated['agency_id'])
            ->first();

        if ($existingSub) {
            $existingSub->update(['is_active' => true, 'notification_type' => $validated['notification_type']]);
            return $this->successResponse(null, 'Subscription reactivated');
        }

        $subscription = auth()->user()->subscriptions()->create($validated);

        return $this->successResponse([
            'id' => $subscription->id,
            'notification_type' => $subscription->notification_type,
        ], 'Subscribed successfully', 201);
    }

    public function destroy($id)
    {
        $subscription = ClientSubscription::findOrFail($id);

        if ($subscription->client_id !== auth()->id()) {
            return $this->forbiddenResponse();
        }

        $subscription->update(['is_active' => false]);

        return $this->successResponse(null, 'Unsubscribed successfully');
    }
}
