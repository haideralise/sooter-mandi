<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Rate;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use ApiResponse;

    /**
     * Current rate per thread, grouped by agency, with trend direction.
     */
    public function agencySummary(Request $request)
    {
        $validated = $request->validate([
            'days' => 'nullable|integer|min:1|max:365',
            'agency_id' => 'nullable|exists:agencies,id',
        ]);

        $days = $validated['days'] ?? 1;
        $since = now()->subDays($days);

        $agencies = Agency::query()
            ->when($validated['agency_id'] ?? null, fn ($q, $id) => $q->where('id', $id))
            ->active()
            ->with(['threads' => fn ($q) => $q->where('is_active', true)])
            ->get();

        $summary = $agencies->map(function (Agency $agency) use ($since) {
            $threads = $agency->threads->map(function ($thread) use ($since) {
                $latest = $thread->rates()->latest('created_at')->first();

                if (! $latest) {
                    return null;
                }

                $baseline = $thread->rates()
                    ->where('created_at', '>=', $since)
                    ->orderBy('created_at')
                    ->first();

                $change = $latest->price_pkr - ($baseline?->price_pkr ?? $latest->price_pkr);
                $changePercent = $baseline && (float) $baseline->price_pkr !== 0.0
                    ? round(($change / $baseline->price_pkr) * 100, 2)
                    : 0;

                return [
                    'thread_id' => $thread->id,
                    'thread_name' => $thread->type.' - '.$thread->color,
                    'packaging' => $thread->packaging_type,
                    'current_price' => $latest->price_pkr,
                    'change' => round($change, 2),
                    'change_percent' => $changePercent,
                    'trend' => $this->trend($change),
                    'updated_at' => $latest->created_at,
                ];
            })->filter()->values();

            return [
                'agency_id' => $agency->id,
                'agency_name' => $agency->name,
                'city' => $agency->city,
                'thread_count' => $threads->count(),
                'threads' => $threads,
            ];
        });

        return $this->successResponse($summary, 'Agency summary generated');
    }

    /**
     * Rate history over a date range, streamed as CSV for export.
     */
    public function rateHistory(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'agency_id' => 'nullable|exists:agencies,id',
            'thread_id' => 'nullable|exists:threads,id',
        ]);

        $query = Rate::query()
            ->with(['thread', 'agency'])
            ->whereBetween('created_at', [
                $validated['start_date'].' 00:00:00',
                $validated['end_date'].' 23:59:59',
            ])
            ->when($validated['agency_id'] ?? null, fn ($q, $id) => $q->where('agency_id', $id))
            ->when($validated['thread_id'] ?? null, fn ($q, $id) => $q->where('thread_id', $id))
            ->orderBy('created_at');

        $filename = "rate-history-{$validated['start_date']}-to-{$validated['end_date']}.csv";

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Agency', 'Thread Type', 'Color', 'Packaging',
                'Date', 'Time', 'Price (PKR)', 'Change', 'Change %',
            ]);

            $query->chunk(500, function ($rates) use ($handle) {
                foreach ($rates as $rate) {
                    $change = $rate->previous_price !== null
                        ? $rate->price_pkr - $rate->previous_price
                        : null;

                    $changePercent = $change !== null && (float) $rate->previous_price !== 0.0
                        ? round(($change / $rate->previous_price) * 100, 2)
                        : null;

                    fputcsv($handle, [
                        $rate->agency?->name,
                        $rate->thread?->type,
                        $rate->thread?->color,
                        $rate->thread?->packaging_type,
                        $rate->created_at->toDateString(),
                        $rate->created_at->toTimeString(),
                        $rate->price_pkr,
                        $change !== null ? round($change, 2) : '',
                        $changePercent !== null ? $changePercent : '',
                    ]);
                }
            });

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function trend(float $change): string
    {
        return match (true) {
            $change > 0 => 'up',
            $change < 0 => 'down',
            default => 'flat',
        };
    }
}
