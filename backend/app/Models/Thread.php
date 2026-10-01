<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Thread extends Model
{
    protected $fillable = [
        'agency_id',
        'type',
        'color',
        'packaging_type',
        'weight_value',
        'weight_unit',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'weight_value' => 'decimal:2',
    ];

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }

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

    public function getLatestRate()
    {
        return $this->rates()->latest()->first();
    }

    public function getCurrentPrice()
    {
        return $this->getLatestRate()?->price_pkr ?? 0;
    }

    public function getPriceHistory($hours = 24)
    {
        return $this->rates()
            ->where('created_at', '>=', now()->subHours($hours))
            ->orderBy('created_at')
            ->get();
    }
}
