<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agency extends Model
{
    protected $fillable = [
        'name',
        'city',
        'godown_address',
        'contact_phone',
        'contact_email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(ClientSubscription::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getCurrentRates()
    {
        return $this->threads()
            ->with(['rates' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->where('is_active', true)
            ->get();
    }
}
