<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_admin();
try{json_response(['orders'=>orders_payload(db(),150)]);}catch(Throwable $e){json_response(['error'=>$e->getMessage()],500);}
