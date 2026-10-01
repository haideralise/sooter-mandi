<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'client_id',
        'thread_id',
        'rate_change_value',
        'rate_change_percent',
        'new_price',
        'old_price',
        'notification_type',
        'status',
        'sent_at',
    ];

    protected $casts = [
        'rate_change_value' => 'decimal:2',
        'rate_change_percent' => 'decimal:2',
        'new_price' => 'decimal:2',
        'old_price' => 'decimal:2',
        'created_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeLatest($query)
    {
        return $query->orderByDesc('created_at');
    }

    public function markAsSent()
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function markAsFailed()
    {
        $this->update(['status' => 'failed']);
    }
}
