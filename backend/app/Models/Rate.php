<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rate extends Model
{
    protected $fillable = [
        'thread_id',
        'agency_id',
        'price_pkr',
        'previous_price',
        'updated_by',
        'godown_address',
        'notes',
    ];

    protected $casts = [
        'price_pkr' => 'decimal:2',
        'previous_price' => 'decimal:2',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getChangeAttribute()
    {
        if (!$this->previous_price) {
            return null;
        }
        return $this->price_pkr - $this->previous_price;
    }

    public function getChangePercentAttribute()
    {
        if (!$this->previous_price || $this->previous_price == 0) {
            return null;
        }
        return ($this->getChangeAttribute() / $this->previous_price) * 100;
    }

    public function scopeLatest($query)
    {
        return $query->latest('created_at');
    }

    public function scopeForThread($query, $threadId)
    {
        return $query->where('thread_id', $threadId);
    }

    public function scopeForAgency($query, $agencyId)
    {
        return $query->where('agency_id', $agencyId);
    }

    public function scopeInLastHours($query, $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }
}
