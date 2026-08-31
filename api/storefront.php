<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
try { json_response(storefront(db())); }
catch (Throwable $e) { json_response(['error'=>$e->getMessage()],500); }
