<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BrokerMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $allowed = $user
            && method_exists($user, 'isBroker')
            && ($user->isBroker() || $user->isAdmin());

        if (! $allowed) {
            return response()->json([
                'success' => false,
                'error' => 'Forbidden. Broker access required.',
                'details' => null,
            ], 403);
        }

        return $next($request);
    }
}
