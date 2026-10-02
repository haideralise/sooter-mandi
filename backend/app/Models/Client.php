<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Client extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'city',
        'organization_name',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login' => 'datetime',
        'password' => 'hashed',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(ClientSubscription::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getSubscribedThreads()
    {
        return $this->subscriptions()
            ->where('is_active', true)
            ->whereNotNull('thread_id')
            ->with('thread')
            ->get()
            ->pluck('thread');
    }

    public function isSubscribedToThread($threadId)
    {
        return $this->subscriptions()
            ->where('thread_id', $threadId)
            ->where('is_active', true)
            ->exists();
    }

    public function logActivity($actionType, $actionDetails = null, $threadId = null, $agencyId = null)
    {
        return $this->activityLogs()->create([
            'action_type' => $actionType,
            'action_details' => $actionDetails,
            'thread_id' => $threadId,
            'agency_id' => $agencyId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
