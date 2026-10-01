<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rate;
use App\Models\Thread;
use App\Models\ClientSubscription;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RateController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $limit = min($request->input('limit', 50), 200);
        $page = $request->input('page', 1);

        $query = Rate::with(['thread', 'agency']);

        if ($request->has('agency_id')) {
            $query->where('agency_id', $request->agency_id);
        }

        if ($request->has('thread_id')) {
            $query->where('thread_id', $request->thread_id);
        }

        // Get latest rate per thread
        $latestRates = $query
            ->latest('created_at')
            ->paginate($limit);

        $data = $latestRates->map(fn($rate) => [
            'id' => $rate->id,
            'thread_id' => $rate->thread_id,
            'thread_name' => $rate->thread->type . ' - ' . $rate->thread->color,
            'agency_id' => $rate->agency_id,
            'agency_name' => $rate->agency->name,
            'price_pkr' => $rate->price_pkr,
            'previous_price' => $rate->previous_price,
            'change' => $rate->price_pkr - ($rate->previous_price ?? $rate->price_pkr),
            'change_percent' => $rate->previous_price
                ? round((($rate->price_pkr - $rate->previous_price) / $rate->previous_price) * 100, 2)
                : 0,
            'packaging' => $rate->thread->packaging_type,
            'weight' => $rate->thread->weight_value . $rate->thread->weight_unit,
            'updated_at' => $rate->updated_at,
        ]);

        $latestRates->setCollection($data);
        return $this->paginatedResponse($latestRates);
    }

    public function history($threadId, Request $request)
    {
        $hours = $request->input('hours', 24);
        $days = $request->input('days');

        if ($days) {
            $hours = $days * 24;
        }

        $thread = Thread::with('agency')->findOr($threadId, fn() =>
            throw ValidationException::withMessages(['thread_id' => 'Thread not found'])
        );

        $history = $thread->rates()
            ->where('created_at', '>=', now()->subHours($hours))
            ->orderBy('created_at')
            ->get();

        $statistics = [
            'current' => $history->last()?->price_pkr ?? 0,
            'high' => $history->max('price_pkr') ?? 0,
            'low' => $history->min('price_pkr') ?? 0,
            'average' => round($history->avg('price_pkr') ?? 0, 2),
        ];

        if ($history->count() >= 2) {
            $first = $history->first();
            $last = $history->last();
            $statistics['change'] = $last->price_pkr - $first->price_pkr;
            $statistics['change_percent'] = round(
                (($last->price_pkr - $first->price_pkr) / $first->price_pkr) * 100, 2
            );
        }

        return $this->successResponse([
            'thread_id' => $thread->id,
            'thread_name' => $thread->type . ' - ' . $thread->color,
            'agency' => $thread->agency->name,
            'history' => $history->map(fn($r) => [
                'price_pkr' => $r->price_pkr,
                'timestamp' => $r->created_at,
            ]),
            'statistics' => $statistics,
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize('isAdmin|isBroker', auth()->user());

        $validated = $request->validate([
            'thread_id' => 'required|exists:threads,id',
            'price_pkr' => 'required|numeric|min:0',
            'godown_address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $thread = Thread::findOrFail($validated['thread_id']);
        $previousRate = $thread->rates()->latest()->first();

        $rate = $thread->rates()->create([
            'agency_id' => $thread->agency_id,
            'price_pkr' => $validated['price_pkr'],
            'previous_price' => $previousRate?->price_pkr,
            'updated_by' => auth()->id(),
            'godown_address' => $validated['godown_address'],
            'notes' => $validated['notes'],
        ]);

        $change = $rate->price_pkr - ($rate->previous_price ?? $rate->price_pkr);
        $changePercent = $rate->previous_price
            ? round(($change / $rate->previous_price) * 100, 2)
            : 0;

        // Trigger notifications
        dispatch(new \App\Jobs\NotifySubscribedClients($thread, $rate));

        // Broadcast event
        broadcast(new \App\Events\RateUpdated($thread, $rate))->toOthers();

        return $this->successResponse([
            'id' => $rate->id,
            'thread_id' => $thread->id,
            'price_pkr' => $rate->price_pkr,
            'previous_price' => $rate->previous_price,
            'change' => $change,
            'change_percent' => $changePercent,
            'updated_at' => $rate->updated_at,
        ], 'Rate updated successfully', 201);
    }

    public function show($rateId)
    {
        $rate = Rate::with(['thread', 'agency'])->findOrFail($rateId);

        return $this->successResponse([
            'id' => $rate->id,
            'thread_id' => $rate->thread_id,
            'thread_name' => $rate->thread->type . ' - ' . $rate->thread->color,
            'agency_id' => $rate->agency_id,
            'agency_name' => $rate->agency->name,
            'price_pkr' => $rate->price_pkr,
            'previous_price' => $rate->previous_price,
            'change' => $rate->price_pkr - ($rate->previous_price ?? $rate->price_pkr),
            'updated_at' => $rate->updated_at,
        ]);
    }
}
