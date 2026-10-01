<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientSubscription extends Model
{
    protected $fillable = [
        'client_id',
        'thread_id',
        'agency_id',
        'notification_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function shouldReceiveNotification()
    {
        return $this->is_active && in_array($this->notification_type, ['All', 'Email', 'Push']);
    }

    public function shouldReceiveEmail()
    {
        return $this->is_active && in_array($this->notification_type, ['All', 'Email']);
    }

    public function shouldReceivePush()
    {
        return $this->is_active && in_array($this->notification_type, ['All', 'Push']);
    }
}
