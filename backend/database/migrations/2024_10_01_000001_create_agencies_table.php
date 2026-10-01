<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agencies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('city');
            $table->text('godown_address')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('city');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agencies');
    }
};
