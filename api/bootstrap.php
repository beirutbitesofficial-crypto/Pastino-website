<?php
declare(strict_types=1);

$config = require __DIR__ . '/../config.php';
date_default_timezone_set($config['timezone'] ?? 'Asia/Beirut');

function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body_json(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function clean_text(mixed $value, int $max = 300): string {
    $value = is_string($value) ? trim($value) : '';
    return mb_substr($value, 0, $max);
}

function db(): PDO {
    static $pdo = null;
    global $config;
    if ($pdo instanceof PDO) return $pdo;
    foreach (['db_name','db_user','db_pass'] as $key) {
        if (str_starts_with((string)($config[$key] ?? ''), 'CHANGE_ME')) {
            throw new RuntimeException('Database is not configured yet. Edit config.php with your Hostinger MySQL details.');
        }
    }
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'] ?? 'localhost', $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
    ensure_schema($pdo);
    return $pdo;
}

function ensure_schema(PDO $pdo): void {
    static $done = false; if ($done) return;
    $queries = [
        "CREATE TABLE IF NOT EXISTS web_menu_items (id VARCHAR(100) PRIMARY KEY, name VARCHAR(120) NOT NULL, description VARCHAR(400) NOT NULL DEFAULT '', price DECIMAL(10,2) NOT NULL, image VARCHAR(1000) NOT NULL DEFAULT '', category VARCHAR(80) NOT NULL DEFAULT 'Pasta', available TINYINT(1) NOT NULL DEFAULT 1, customizable TINYINT(1) NOT NULL DEFAULT 1, sort_order INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS web_options (id VARCHAR(100) PRIMARY KEY, name VARCHAR(120) NOT NULL, price DECIMAL(10,2) NOT NULL DEFAULT 0, emoji VARCHAR(24) NOT NULL DEFAULT '✦', kind ENUM('pasta','sauce','topping','cheese') NOT NULL DEFAULT 'topping', available TINYINT(1) NOT NULL DEFAULT 1, sort_order INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS web_settings (id VARCHAR(30) PRIMARY KEY, brand_name VARCHAR(80) NOT NULL DEFAULT 'Pastino', hero_title VARCHAR(180) NOT NULL DEFAULT 'Pasta made your way.', hero_subtitle VARCHAR(500) NOT NULL DEFAULT '', whatsapp_number VARCHAR(40) NOT NULL DEFAULT '', currency VARCHAR(12) NOT NULL DEFAULT 'USD', delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS online_orders (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_number VARCHAR(50) NOT NULL UNIQUE, status ENUM('new','accepted','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'new', order_type ENUM('takeaway','delivery') NOT NULL, customer_name VARCHAR(120) NOT NULL, phone VARCHAR(60) NOT NULL, address VARCHAR(400) NOT NULL DEFAULT '', notes VARCHAR(700) NOT NULL DEFAULT '', subtotal DECIMAL(10,2) NOT NULL, delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0, total DECIMAL(10,2) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX(created_at), INDEX(status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS online_order_items (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL, menu_item_id VARCHAR(100) NOT NULL, name VARCHAR(120) NOT NULL, quantity INT NOT NULL DEFAULT 1, unit_price DECIMAL(10,2) NOT NULL, options_json TEXT NOT NULL, line_total DECIMAL(10,2) NOT NULL, INDEX(order_id), CONSTRAINT fk_online_order FOREIGN KEY(order_id) REFERENCES online_orders(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];
    foreach ($queries as $sql) $pdo->exec($sql);

    $count = (int)$pdo->query('SELECT COUNT(*) FROM web_menu_items')->fetchColumn();
    if ($count === 0) {
        $stmt = $pdo->prepare('INSERT INTO web_menu_items (id,name,description,price,image,category,available,customizable,sort_order) VALUES (?,?,?,?,?,?,?,?,?)');
        $items = [
            ['menu-medium','Medium','1 sauce · 2 toppings included',7,'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=88','Pasta',1,1,10],
            ['menu-large','Large','1 sauce · 3 toppings included',8,'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=1200&q=88','Pasta',1,1,20],
            ['menu-signature','The Signature','2 sauces · 4 toppings included',9,'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=88','Pasta',1,1,30]
        ];
        foreach ($items as $item) $stmt->execute($item);
    }

    $count = (int)$pdo->query('SELECT COUNT(*) FROM web_options')->fetchColumn();
    if ($count === 0) {
        $stmt = $pdo->prepare('INSERT INTO web_options (id,name,price,emoji,kind,available,sort_order) VALUES (?,?,?,?,?,?,?)');
        $options = [
            ['pasta-penne','Penne',0,'🍝','pasta',1,10],['pasta-fusilli','Fusilli',0,'🍝','pasta',1,20],['pasta-fettuccine','Fettuccine',0,'🍝','pasta',1,30],['pasta-farfalle','Farfalle',0,'🍝','pasta',1,40],
            ['sauce-tomato','Tomato sauce',0,'🍅','sauce',1,50],['sauce-alfredo','Alfredo sauce',0,'🥣','sauce',1,60],
            ['topping-chicken','Grilled chicken',0,'🍗','topping',1,70],['topping-shrimp','Shrimp',0,'🍤','topping',1,80],['topping-mushrooms','Mushrooms',0,'🍄','topping',1,90],['topping-bell-peppers','Bell peppers',0,'🫑','topping',1,100],['topping-green-peppers','Green peppers',0,'🌶️','topping',1,110],
            ['cheese-parmesan','Parmesan',1,'🧀','cheese',1,120],['cheese-mozzarella','Mozzarella',1,'🧀','cheese',1,130]
        ];
        foreach ($options as $option) $stmt->execute($option);
    }

    $pdo->exec("INSERT IGNORE INTO web_settings (id,brand_name,hero_title,hero_subtitle,whatsapp_number,currency,delivery_fee) VALUES ('default','Pastino','Pasta made your way.','Pick your size, pasta, sauce and toppings. We prepare it fresh and send your order straight to Pastino.','','USD',0)");
    $done = true;
}

function storefront(PDO $pdo): array {
    $menu = array_map(fn($r)=>['id'=>$r['id'],'name'=>$r['name'],'description'=>$r['description'],'price'=>(float)$r['price'],'image'=>$r['image'],'category'=>$r['category'],'available'=>(bool)$r['available'],'customizable'=>(bool)$r['customizable'],'sortOrder'=>(int)$r['sort_order']], $pdo->query('SELECT * FROM web_menu_items ORDER BY sort_order,id')->fetchAll());
    $options = array_map(fn($r)=>['id'=>$r['id'],'name'=>$r['name'],'price'=>(float)$r['price'],'emoji'=>$r['emoji'],'kind'=>$r['kind'],'available'=>(bool)$r['available'],'sortOrder'=>(int)$r['sort_order']], $pdo->query('SELECT * FROM web_options ORDER BY sort_order,id')->fetchAll());
    $r = $pdo->query("SELECT * FROM web_settings WHERE id='default' LIMIT 1")->fetch();
    $settings = ['id'=>$r['id'],'brandName'=>$r['brand_name'],'heroTitle'=>$r['hero_title'],'heroSubtitle'=>$r['hero_subtitle'],'whatsappNumber'=>$r['whatsapp_number'],'currency'=>$r['currency'],'deliveryFee'=>(float)$r['delivery_fee']];
    return ['menu'=>$menu,'toppings'=>$options,'settings'=>$settings];
}

function request_header(string $name): string {
    $server = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return trim((string)($_SERVER[$server] ?? ''));
}

function require_admin(): void {
    global $config;
    $expected = (string)($config['admin_password'] ?? '');
    if ($expected === '' || str_starts_with($expected, 'CHANGE_ME')) json_response(['error'=>'Admin password is not configured in config.php.'],503);
    if (!hash_equals($expected, request_header('X-Admin-Password'))) json_response(['error'=>'Invalid admin password.'],401);
}

function require_system(): void {
    global $config;
    $expected = (string)($config['system_api_key'] ?? '');
    if ($expected === '' || str_starts_with($expected, 'CHANGE_ME')) json_response(['error'=>'System API key is not configured in config.php.'],503);
    if (!hash_equals($expected, request_header('X-Pastino-Key'))) json_response(['error'=>'Invalid system API key.'],401);
}

function require_admin_or_system(): void {
    global $config;
    $admin = request_header('X-Admin-Password'); $system = request_header('X-Pastino-Key');
    $adminExpected = (string)($config['admin_password'] ?? ''); $systemExpected = (string)($config['system_api_key'] ?? '');
    if ($admin !== '' && !str_starts_with($adminExpected,'CHANGE_ME') && hash_equals($adminExpected,$admin)) return;
    if ($system !== '' && !str_starts_with($systemExpected,'CHANGE_ME') && hash_equals($systemExpected,$system)) return;
    json_response(['error'=>'Unauthorized.'],401);
}

function orders_payload(PDO $pdo, int $limit = 150): array {
    $limit = max(1,min($limit,200));
    $orders = $pdo->query("SELECT * FROM online_orders ORDER BY id DESC LIMIT {$limit}")->fetchAll();
    if (!$orders) return [];
    $ids = array_column($orders,'id'); $placeholders = implode(',',array_fill(0,count($ids),'?'));
    $stmt = $pdo->prepare("SELECT * FROM online_order_items WHERE order_id IN ($placeholders) ORDER BY id"); $stmt->execute($ids); $items = $stmt->fetchAll();
    return array_map(function($o) use ($items) {
        $orderItems = array_values(array_filter($items,fn($i)=>(string)$i['order_id']===(string)$o['id']));
        return ['id'=>(int)$o['id'],'orderNumber'=>$o['order_number'],'status'=>$o['status'],'orderType'=>$o['order_type'],'customerName'=>$o['customer_name'],'phone'=>$o['phone'],'address'=>$o['address'],'notes'=>$o['notes'],'subtotal'=>(float)$o['subtotal'],'deliveryFee'=>(float)$o['delivery_fee'],'total'=>(float)$o['total'],'createdAt'=>$o['created_at'],'updatedAt'=>$o['updated_at'],'items'=>array_map(fn($i)=>['id'=>(int)$i['id'],'name'=>$i['name'],'quantity'=>(int)$i['quantity'],'unitPrice'=>(float)$i['unit_price'],'lineTotal'=>(float)$i['line_total'],'toppings'=>json_decode($i['options_json'],true) ?: []],$orderItems)];
    },$orders);
}
