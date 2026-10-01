<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $this->authorize('isAdmin', auth()->user());

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

        return $this->paginatedResponse($logs->map(fn($log) => [
            'id' => $log->id,
            'client_id' => $log->client_id,
            'client_name' => $log->client->name,
            'action_type' => $log->action_type,
            'action_details' => $log->action_details,
            'thread_id' => $log->thread_id,
            'agency_id' => $log->agency_id,
            'ip_address' => $log->ip_address,
            'timestamp' => $log->created_at,
        ]));
    }

    public function export(Request $request)
    {
        $this->authorize('isAdmin', auth()->user());

        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after:start_date',
            'client_id' => 'nullable|exists:clients,id',
        ]);

        $query = ActivityLog::with(['client'])
            ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']]);

        if ($validated['client_id'] ?? null) {
            $query->where('client_id', $validated['client_id']);
        }

        $logs = $query->latest('created_at')->get();

        $csv = "Client Name,Client Email,Action Type,Details,IP Address,Timestamp\n";
        foreach ($logs as $log) {
            $csv .= "\"{$log->client->name}\",\"{$log->client->email}\",\"{$log->action_type}\",\"{$log->action_details}\",\"{$log->ip_address}\",\"{$log->created_at}\"\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="activity-logs.csv"');
    }
}
