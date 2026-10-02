<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\BrokerMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum's stateful middleware applies the session + CSRF stack to API
        // routes whenever the request Origin is a "stateful" domain, and
        // localhost:3000 is one by default. The Next.js app authenticates with
        // bearer tokens from a different origin, so CSRF must be excluded or
        // every browser request fails with "CSRF token mismatch".
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'broker' => BrokerMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
