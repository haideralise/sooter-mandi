<?php

namespace App\Events;

use App\Models\Rate;
use App\Models\Thread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RateUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Thread $thread,
        public Rate $rate,
    ) {}

    /**
     * Public channel — every client dashboard listens to the whole market.
     */
    public function broadcastOn(): array
    {
        return [new Channel('rates')];
    }

    public function broadcastAs(): string
    {
        return 'rate-updated';
    }

    public function broadcastWith(): array
    {
        $old = $this->rate->previous_price;
        $new = $this->rate->price_pkr;

        $change = $old !== null ? $new - $old : 0;
        $changePercent = $old !== null && (float) $old !== 0.0
            ? round(($change / $old) * 100, 2)
            : 0;

        return [
            'rate_id' => $this->rate->id,
            'thread_id' => $this->thread->id,
            'thread_name' => $this->thread->type.' - '.$this->thread->color,
            'agency_id' => $this->thread->agency_id,
            'agency_name' => $this->thread->agency?->name,
            'packaging' => $this->thread->packaging_type,
            'old_price' => $old,
            'new_price' => $new,
            'change' => round($change, 2),
            'change_percent' => $changePercent,
            'timestamp' => $this->rate->created_at?->toIso8601String(),
        ];
    }
}
