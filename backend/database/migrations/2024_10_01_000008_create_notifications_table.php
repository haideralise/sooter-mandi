<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('thread_id')->constrained('threads')->cascadeOnDelete();
            $table->decimal('rate_change_value', 10, 2)->nullable();
            $table->decimal('rate_change_percent', 5, 2)->nullable();
            $table->decimal('new_price', 10, 2)->nullable();
            $table->decimal('old_price', 10, 2)->nullable();
            $table->enum('notification_type', ['email', 'push', 'both'])->default('both');
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('status');
            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
