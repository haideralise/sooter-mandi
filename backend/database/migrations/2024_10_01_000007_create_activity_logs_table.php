<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('action_type', 100);
            $table->text('action_details')->nullable();
            $table->foreignId('thread_id')->nullable()->constrained('threads')->nullOnDelete();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['client_id', 'created_at']);
            $table->index('action_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
