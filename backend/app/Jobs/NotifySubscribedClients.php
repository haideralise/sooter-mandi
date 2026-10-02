<?php

namespace App\Jobs;

use App\Models\ClientSubscription;
use App\Models\Notification;
use App\Models\Rate;
use App\Models\Thread;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class NotifySubscribedClients implements ShouldQueue
{
    use Queueable;

    /**
     * Maps a subscription's preference onto a notification row's delivery type.
     */
    private const DELIVERY = [
        'All' => 'both',
        'Email' => 'email',
        'Push' => 'push',
    ];

    public function __construct(
        public Thread $thread,
        public Rate $rate,
    ) {}

    public function handle(): void
    {
        $old = $this->rate->previous_price;
        $new = $this->rate->price_pkr;

        $change = $old !== null ? $new - $old : null;
        $changePercent = $change !== null && (float) $old !== 0.0
            ? round(($change / $old) * 100, 2)
            : null;

        foreach ($this->subscribers() as $subscription) {
            Notification::create([
                'client_id' => $subscription->client_id,
                'thread_id' => $this->thread->id,
                // Cast to string: brick/math deprecates floats reaching a decimal cast.
                'rate_change_value' => $change !== null ? number_format($change, 2, '.', '') : null,
                'rate_change_percent' => $changePercent !== null ? number_format($changePercent, 2, '.', '') : null,
                'new_price' => $new,
                'old_price' => $old,
                'notification_type' => self::DELIVERY[$subscription->notification_type] ?? 'both',
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Active subscriptions that cover this thread, either directly or through a
     * whole-agency subscription. A client holding both only gets notified once.
     */
    private function subscribers()
    {
        return ClientSubscription::query()
            ->with('client')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->where('thread_id', $this->thread->id)
                    ->orWhere(function ($agencyWide) {
                        $agencyWide->whereNull('thread_id')
                            ->where('agency_id', $this->thread->agency_id);
                    });
            })
            ->get()
            ->filter(fn (ClientSubscription $subscription) => $subscription->client?->is_active
                && $subscription->shouldReceiveNotification())
            // Prefer the thread-specific subscription when a client has both.
            ->sortByDesc(fn (ClientSubscription $subscription) => $subscription->thread_id !== null)
            ->unique('client_id');
    }
}
