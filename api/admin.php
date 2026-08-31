<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_admin();
try {
    $pdo=db(); $method=$_SERVER['REQUEST_METHOD'];
    if($method==='GET') json_response(storefront($pdo));
    $body=body_json();
    if($method==='PATCH'){
        $brand=clean_text($body['brandName']??'Pastino',80)?:'Pastino'; $title=clean_text($body['heroTitle']??'Pasta made your way.',180)?:'Pasta made your way.'; $sub=clean_text($body['heroSubtitle']??'',500); $wa=clean_text($body['whatsappNumber']??'',40); $currency=clean_text($body['currency']??'USD',12)?:'USD'; $fee=max(0,(float)($body['deliveryFee']??0));
        $stmt=$pdo->prepare("UPDATE web_settings SET brand_name=?,hero_title=?,hero_subtitle=?,whatsapp_number=?,currency=?,delivery_fee=? WHERE id='default'"); $stmt->execute([$brand,$title,$sub,$wa,$currency,$fee]); json_response(['ok'=>true]);
    }
    if($method==='PUT'){
        $kind=clean_text($body['kind']??'',30);
        if($kind==='item'){
            $id=clean_text($body['id']??'',100)?:'menu-'.substr(bin2hex(random_bytes(5)),0,10); $name=clean_text($body['name']??'',120); if(mb_strlen($name)<2)json_response(['error'=>'Item name is required.'],400);
            $stmt=$pdo->prepare("INSERT INTO web_menu_items (id,name,description,price,image,category,available,customizable,sort_order) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),price=VALUES(price),image=VALUES(image),category=VALUES(category),available=VALUES(available),customizable=VALUES(customizable),sort_order=VALUES(sort_order)");
            $stmt->execute([$id,$name,clean_text($body['description']??'',400),max(0,(float)($body['price']??0)),clean_text($body['image']??'',1000),clean_text($body['category']??'Pasta',80)?:'Pasta',($body['available']??true)?1:0,($body['customizable']??true)?1:0,(int)($body['sortOrder']??0)]); json_response(['ok'=>true,'id'=>$id]);
        }
        if($kind==='option'){
            $valid=['pasta','sauce','topping','cheese']; $optionKind=in_array($body['optionKind']??'',$valid,true)?$body['optionKind']:'topping'; $id=clean_text($body['id']??'',100)?:'option-'.substr(bin2hex(random_bytes(5)),0,10); $name=clean_text($body['name']??'',120); if(mb_strlen($name)<2)json_response(['error'=>'Option name is required.'],400);
            $stmt=$pdo->prepare("INSERT INTO web_options (id,name,price,emoji,kind,available,sort_order) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),price=VALUES(price),emoji=VALUES(emoji),kind=VALUES(kind),available=VALUES(available),sort_order=VALUES(sort_order)");
            $stmt->execute([$id,$name,max(0,(float)($body['price']??0)),clean_text($body['emoji']??'✦',24)?:'✦',$optionKind,($body['available']??true)?1:0,(int)($body['sortOrder']??0)]); json_response(['ok'=>true,'id'=>$id]);
        }
        json_response(['error'=>'Unknown item type.'],400);
    }
    if($method==='DELETE'){
        $kind=$_GET['kind']??''; $id=clean_text($_GET['id']??'',100); if($id==='')json_response(['error'=>'Missing id.'],400);
        if($kind==='item'){$stmt=$pdo->prepare('DELETE FROM web_menu_items WHERE id=?');$stmt->execute([$id]);}
        elseif($kind==='option'){$stmt=$pdo->prepare('DELETE FROM web_options WHERE id=?');$stmt->execute([$id]);}
        else json_response(['error'=>'Unknown item type.'],400); json_response(['ok'=>true]);
    }
    json_response(['error'=>'Method not allowed.'],405);
} catch(Throwable $e){json_response(['error'=>$e->getMessage()],500);}
