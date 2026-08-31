<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_admin_or_system();
if($_SERVER['REQUEST_METHOD']!=='PATCH'&&$_SERVER['REQUEST_METHOD']!=='POST')json_response(['error'=>'Method not allowed.'],405);
try{
    $id=(int)($_GET['id']??0); $body=body_json(); $status=(string)($body['status']??''); $valid=['new','accepted','preparing','ready','completed','cancelled'];
    if($id<1||!in_array($status,$valid,true))json_response(['error'=>'Invalid order or status.'],400);
    $stmt=db()->prepare('UPDATE online_orders SET status=?,updated_at=? WHERE id=?'); $stmt->execute([$status,date('Y-m-d H:i:s'),$id]); if($stmt->rowCount()===0)json_response(['error'=>'Order not found.'],404); json_response(['ok'=>true]);
}catch(Throwable $e){json_response(['error'=>$e->getMessage()],500);}
