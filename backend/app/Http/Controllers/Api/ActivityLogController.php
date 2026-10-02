<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = ActivityLog::with(['client', 'thread', 'agency']);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        $days = $request->input('days', 7);
        $query->where('created_at', '>=', now()->subDays($days));

        $logs = $query->latest('created_at')->paginate($request->input('limit', 100));

        $logs->setCollection($logs->getCollection()->map(fn($log) => [
            'id' => $log->id,
            'client_id' => $log->client_id,
            'client_name' => $log->client?->name,
            'action_type' => $log->action_type,
            'action_details' => $log->action_details,
            'thread_id' => $log->thread_id,
            'agency_id' => $log->agency_id,
            'ip_address' => $log->ip_address,
            'timestamp' => $log->created_at,
        ]));

        return $this->paginatedResponse($logs);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            // after_or_equal, not after: exporting a single day is legitimate.
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'client_id' => 'nullable|exists:clients,id',
        ]);

        $query = ActivityLog::with(['client'])
            // A bare end date coerces to 00:00:00, which silently drops the
            // whole final day -- so an export ending "today" returned nothing.
            ->whereBetween('created_at', [
                $validated['start_date'].' 00:00:00',
                $validated['end_date'].' 23:59:59',
            ]);

        if ($validated['client_id'] ?? null) {
            $query->where('client_id', $validated['client_id']);
        }

        $query->orderBy('created_at');

        $filename = "activity-logs-{$validated['start_date']}-to-{$validated['end_date']}.csv";

        // Streamed + fputcsv so quotes and commas in action_details are escaped
        // rather than corrupting the row.
        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Client Name', 'Client Email', 'Action Type', 'Details', 'IP Address', 'Timestamp',
            ]);

            $query->chunk(500, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->client?->name,
                        $log->client?->email,
                        $log->action_type,
                        $log->action_details,
                        $log->ip_address,
                        $log->created_at,
                    ]);
                }
            });

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
