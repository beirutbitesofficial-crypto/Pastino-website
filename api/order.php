<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error'=>'Method not allowed.'],405);

try {
    $pdo = db(); $body = body_json(); $store = storefront($pdo);
    $orderType = ($body['orderType'] ?? '') === 'delivery' ? 'delivery' : 'takeaway';
    $name = clean_text($body['customerName'] ?? '',120); $phone = clean_text($body['phone'] ?? '',60); $address = clean_text($body['address'] ?? '',400); $notes = clean_text($body['notes'] ?? '',700);
    if (mb_strlen($name)<2 || mb_strlen($phone)<5) json_response(['error'=>'Name and phone are required.'],400);
    if ($orderType==='delivery' && mb_strlen($address)<5) json_response(['error'=>'Delivery address is required.'],400);
    $selections = is_array($body['items'] ?? null) ? $body['items'] : [];
    if (!$selections || count($selections)>20) json_response(['error'=>'Your cart is empty or too large.'],400);

    $menuById=[]; foreach($store['menu'] as $i) if($i['available']) $menuById[$i['id']]=$i;
    $optById=[]; foreach($store['toppings'] as $o) if($o['available']) $optById[$o['id']]=$o;
    $lines=[];
    foreach($selections as $selection){
        $itemId=clean_text($selection['menuItemId'] ?? '',100); if(!isset($menuById[$itemId])) json_response(['error'=>'A menu item is unavailable.'],400); $item=$menuById[$itemId];
        $qty=max(1,min(20,(int)($selection['quantity'] ?? 1)));
        $ids=[]; if(!empty($selection['pastaId']))$ids[]=$selection['pastaId']; foreach(['sauceIds','toppingIds','cheeseIds'] as $field) foreach((array)($selection[$field] ?? []) as $id)$ids[]=$id;
        $chosen=[]; foreach($ids as $id) if(isset($optById[$id]))$chosen[]=$optById[$id];
        $pasta=array_values(array_filter($chosen,fn($o)=>$o['kind']==='pasta')); $sauces=array_values(array_filter($chosen,fn($o)=>$o['kind']==='sauce')); $tops=array_values(array_filter($chosen,fn($o)=>$o['kind']==='topping'));
        $lower=strtolower($item['name']); $requiredSauces=str_contains($lower,'signature')?2:1; $maxTops=str_contains($lower,'signature')?4:(str_contains($lower,'large')?3:2);
        if($item['customizable'] && (count($pasta)!==1 || count($sauces)!==$requiredSauces || count($tops)>$maxTops)) json_response(['error'=>'Please complete '.$item['name'].' selections correctly.'],400);
        $unit=(float)$item['price']; foreach($chosen as $o)$unit+=(float)$o['price']; $labels=array_map(fn($o)=>trim($o['emoji'].' '.$o['name']),$chosen);
        $lines[]=['menuItemId'=>$item['id'],'name'=>$item['name'],'quantity'=>$qty,'unitPrice'=>$unit,'lineTotal'=>$unit*$qty,'labels'=>$labels];
    }
    $subtotal=array_sum(array_column($lines,'lineTotal')); $deliveryFee=$orderType==='delivery'?(float)$store['settings']['deliveryFee']:0; $total=$subtotal+$deliveryFee;
    $orderNumber='WEB-'.date('ymd').'-'.strtoupper(substr(bin2hex(random_bytes(4)),0,6)); $now=date('Y-m-d H:i:s');
    $pdo->beginTransaction();
    $stmt=$pdo->prepare("INSERT INTO online_orders (order_number,status,order_type,customer_name,phone,address,notes,subtotal,delivery_fee,total,created_at,updated_at) VALUES (?,'new',?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([$orderNumber,$orderType,$name,$phone,$address,$notes,$subtotal,$deliveryFee,$total,$now,$now]); $orderId=(int)$pdo->lastInsertId();
    $itemStmt=$pdo->prepare('INSERT INTO online_order_items (order_id,menu_item_id,name,quantity,unit_price,options_json,line_total) VALUES (?,?,?,?,?,?,?)');
    foreach($lines as $line)$itemStmt->execute([$orderId,$line['menuItemId'],$line['name'],$line['quantity'],$line['unitPrice'],json_encode($line['labels'],JSON_UNESCAPED_UNICODE),$line['lineTotal']]);
    $pdo->commit();
    $currency=$store['settings']['currency']; $fmt=fn($n)=>$currency.' '.number_format((float)$n,2,'.','');
    $parts=["🍝 *NEW PASTINO ORDER*","Order: $orderNumber","Type: ".strtoupper($orderType),"Customer: $name","Phone: $phone"];
    if($orderType==='delivery')$parts[]="Address: $address"; $parts[]='';
    foreach($lines as $line){$parts[]=$line['quantity'].'× '.$line['name'].' — '.$fmt($line['lineTotal']); foreach($line['labels'] as $label)$parts[]='  '.$label;}
    $parts[]=''; $parts[]='Subtotal: '.$fmt($subtotal); if($deliveryFee>0)$parts[]='Delivery: '.$fmt($deliveryFee); $parts[]='*Total: '.$fmt($total).'*'; if($notes!=='')$parts[]='Notes: '.$notes;
    $number=preg_replace('/\D+/','',(string)$store['settings']['whatsappNumber']); $wa=$number!==''?'https://wa.me/'.$number.'?text='.rawurlencode(implode("\n",$parts)):null;
    json_response(['ok'=>true,'orderId'=>$orderId,'orderNumber'=>$orderNumber,'total'=>$total,'whatsappUrl'=>$wa]);
} catch(Throwable $e){ if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack(); json_response(['error'=>$e->getMessage()],500); }
