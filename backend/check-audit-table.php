<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking audit_logs table structure:\n";
echo str_repeat('=', 80) . "\n\n";

$columns = DB::select('DESCRIBE audit_logs');

foreach ($columns as $column) {
    echo "Column: {$column->Field}\n";
    echo "  Type: {$column->Type}\n";
    echo "  Null: {$column->Null}\n";
    echo "  Key: {$column->Key}\n";
    echo "  Default: {$column->Default}\n";
    echo "\n";
}
