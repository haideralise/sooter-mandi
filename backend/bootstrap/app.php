<?php

use Illuminate\Foundation\Application;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function ($middleware) {
        $middleware->statefulApi();
        $middleware->trustProxies(at: '*');
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withCommands([
        __DIR__.'/../app/Console/Commands',
    ])
    ->withExceptions(function ($exceptions) {
        //
    })->create();
