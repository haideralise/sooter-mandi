<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('thread_id')->nullable()->constrained('threads')->cascadeOnDelete();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->cascadeOnDelete();
            $table->enum('notification_type', ['All', 'Email', 'Push'])->default('All');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['client_id', 'thread_id', 'agency_id']);
            $table->index(['client_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_subscriptions');
    }
};
