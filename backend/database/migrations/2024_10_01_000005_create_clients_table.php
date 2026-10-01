<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 20)->unique();
            $table->string('password');
            $table->string('city')->nullable();
            $table->string('organization_name', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('email');
            $table->index('phone');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
