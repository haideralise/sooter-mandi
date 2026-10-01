<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->string('type', 100);
            $table->string('color', 100);
            $table->enum('packaging_type', ['Carton', 'Bag'])->default('Carton');
            $table->decimal('weight_value', 10, 2)->nullable();
            $table->enum('weight_unit', ['lbs', 'kg', 'g'])->default('lbs');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['agency_id', 'type', 'color', 'packaging_type']);
            $table->index(['agency_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('threads');
    }
};
