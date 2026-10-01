<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RateController;
use App\Http\Controllers\Api\AgencyController;
use App\Http\Controllers\Api\ThreadController;
use App\Http\Controllers\Api\ClientSubscriptionController;
use App\Http\Controllers\Api\ActivityLogController;

Route::prefix('v1')->group(function () {
    // Public Auth Routes
    Route::post('/auth/register', [App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('/auth/login', [App\Http\Controllers\Api\AuthController::class, 'login']);

    // Protected Routes (requires authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::post('/auth/logout', [App\Http\Controllers\Api\AuthController::class, 'logout']);
        Route::get('/auth/me', [App\Http\Controllers\Api\AuthController::class, 'me']);

        // Rates
        Route::get('/rates', [RateController::class, 'index']);
        Route::get('/rates/{id}', [RateController::class, 'show']);
        Route::get('/rates/{id}/history', [RateController::class, 'history']);
        Route::post('/rates/update', [RateController::class, 'update'])->middleware('broker');

        // Agencies
        Route::get('/agencies', [AgencyController::class, 'index']);
        Route::get('/agencies/{id}', [AgencyController::class, 'show']);
        Route::post('/agencies', [AgencyController::class, 'store'])->middleware('admin');
        Route::put('/agencies/{id}', [AgencyController::class, 'update'])->middleware('admin');
        Route::delete('/agencies/{id}', [AgencyController::class, 'destroy'])->middleware('admin');

        // Threads
        Route::get('/threads', [ThreadController::class, 'index']);
        Route::get('/threads/{id}', [ThreadController::class, 'show']);
        Route::post('/threads', [ThreadController::class, 'store'])->middleware('admin');
        Route::put('/threads/{id}', [ThreadController::class, 'update'])->middleware('admin');

        // Client Subscriptions
        Route::get('/subscriptions', [ClientSubscriptionController::class, 'index']);
        Route::post('/subscriptions', [ClientSubscriptionController::class, 'store']);
        Route::delete('/subscriptions/{id}', [ClientSubscriptionController::class, 'destroy']);

        // Activity Logs (Admin only)
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->middleware('admin');
        Route::get('/activity-logs/export', [ActivityLogController::class, 'export'])->middleware('admin');

        // Reports (Admin only)
        Route::get('/reports/agency-summary', [App\Http\Controllers\Api\ReportController::class, 'agencySummary'])->middleware('admin');
        Route::get('/reports/rate-history', [App\Http\Controllers\Api\ReportController::class, 'rateHistory'])->middleware('admin');
    });
});

// Health Check
Route::get('/health', fn() => response()->json(['status' => 'ok']));
