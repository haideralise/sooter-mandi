<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new client (loom owner) account.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:clients,email',
            'phone' => 'required|string|max:20|unique:clients,phone',
            'password' => 'required|string|min:8|confirmed',
            'city' => 'nullable|string|max:255',
            'organization_name' => 'nullable|string|max:255',
        ]);

        $client = Client::create($validated + ['is_active' => true]);

        $token = $client->createToken('client-api')->plainTextToken;

        $client->logActivity('registered', 'Client account created');

        return $this->successResponse([
            'client_id' => $client->id,
            'name' => $client->name,
            'email' => $client->email,
            'role' => 'client',
            'token' => $token,
        ], 'Registration successful', 201);
    }

    /**
     * Log in a client or a staff user (admin/broker) and issue an API token.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'as' => ['nullable', Rule::in(['client', 'staff'])],
        ]);

        $account = $this->resolveAccount($validated['email'], $validated['as'] ?? null);

        if (! $account || ! Hash::check($validated['password'], $account->password)) {
            return $this->errorResponse('Invalid email or password.', 401);
        }

        if (! $account->is_active) {
            return $this->errorResponse('This account has been deactivated.', 403);
        }

        $account->forceFill(['last_login' => now()])->save();

        $isClient = $account instanceof Client;
        $token = $account->createToken($isClient ? 'client-api' : 'staff-api')->plainTextToken;

        if ($isClient) {
            $account->logActivity('logged_in', 'Client logged in');
        }

        return $this->successResponse([
            'token' => $token,
            'role' => $isClient ? 'client' : $account->role,
            $isClient ? 'client' : 'user' => $this->accountPayload($account),
        ], 'Login successful');
    }

    /**
     * Revoke the token used for the current request.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Return the authenticated account.
     */
    public function me(Request $request)
    {
        $account = $request->user();

        return $this->successResponse([
            'role' => $account instanceof Client ? 'client' : $account->role,
            'account' => $this->accountPayload($account),
        ]);
    }

    /**
     * Clients and staff live in separate tables, so look the email up in both
     * unless the caller pinned the account type with "as".
     */
    private function resolveAccount(string $email, ?string $as)
    {
        if ($as === 'client') {
            return Client::where('email', $email)->first();
        }

        if ($as === 'staff') {
            return User::where('email', $email)->first();
        }

        return Client::where('email', $email)->first()
            ?? User::where('email', $email)->first();
    }

    private function accountPayload($account): array
    {
        $payload = [
            'id' => $account->id,
            'name' => $account->name,
            'email' => $account->email,
            'phone' => $account->phone,
            'is_active' => $account->is_active,
            'last_login' => $account->last_login,
        ];

        if ($account instanceof Client) {
            return $payload + [
                'city' => $account->city,
                'organization_name' => $account->organization_name,
            ];
        }

        return $payload + ['role' => $account->role];
    }
}
