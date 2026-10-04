<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_system();

// Menu sync from the Pastino POS. The POS is the source of truth: it sends its whole
// menu (pastino-menu-v2) and option list (pastino-toppings-v2) and this endpoint makes
// the website match it exactly, keeping the same ids so online orders map back to POS items.
//
//   POST /api/system-menu.php   X-Pastino-Key: <system_api_key>
//   { "menu": [MenuItem...], "toppings": [Topping...] }
//   GET  /api/system-menu.php   → current website menu (for checking a sync)

const POS_PORTIONS = [
    'menu-medium' => ['pasta'=>1,'sauce'=>1,'topping'=>2],
    'menu-large' => ['pasta'=>1,'sauce'=>1,'topping'=>3],
    'menu-signature' => ['pasta'=>1,'sauce'=>2,'topping'=>4],
];
const POS_DEFAULT_PORTION = ['pasta'=>1,'sauce'=>1,'topping'=>2];

function pos_option_kind(array $option): string {
    $kind = (string)($option['kind'] ?? '');
    if (in_array($kind, ['pasta','sauce','topping','cheese'], true)) return $kind;
    $id = (string)($option['id'] ?? '');
    foreach (['pasta','sauce','cheese'] as $prefix) if (str_starts_with($id, $prefix.'-')) return $prefix;
    return 'topping';
}

function pos_portion(array $item): array {
    $portion = is_array($item['portion'] ?? null) ? $item['portion'] : (POS_PORTIONS[(string)($item['id'] ?? '')] ?? POS_DEFAULT_PORTION);
    $count = fn($key) => max(0, min(20, (int)($portion[$key] ?? POS_DEFAULT_PORTION[$key])));
    return ['pasta'=>$count('pasta'),'sauce'=>$count('sauce'),'topping'=>$count('topping')];
}

function pos_id(mixed $value): string {
    $id = clean_text($value, 100);
    return preg_match('/^[A-Za-z0-9_.:-]+$/', $id) ? $id : '';
}

try {
    $pdo = db();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') json_response(storefront($pdo));
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error'=>'Method not allowed.'],405);

    $body = body_json();
    $menu = is_array($body['menu'] ?? null) ? array_values($body['menu']) : [];
    $toppings = is_array($body['toppings'] ?? null) ? array_values($body['toppings']) : [];
    // An empty list is almost certainly a broken client, never wipe the live website for it.
    if (!$menu || count($menu) > 500 || count($toppings) > 500) json_response(['error'=>'Send the full POS menu (1–500 items).'],400);

    $items = [];
    foreach ($menu as $i => $item) {
        if (!is_array($item)) continue;
        $id = pos_id($item['id'] ?? ''); $name = clean_text($item['name'] ?? '', 120);
        if ($id === '' || mb_strlen($name) < 1) continue;
        $portion = pos_portion($item);
        $image = clean_text($item['image'] ?? '', 1000);
        if ($image !== '' && !preg_match('#^(https?://|/)#i', $image)) $image = '';
        $items[$id] = [$id, $name, clean_text($item['description'] ?? '', 400), max(0, (float)($item['price'] ?? 0)), $image,
            clean_text($item['category'] ?? 'Pasta', 80) ?: 'Pasta', !empty($item['available']) ? 1 : 0, !empty($item['customizable']) ? 1 : 0,
            ($i + 1) * 10, $portion['pasta'], $portion['sauce'], $portion['topping']];
    }
    $options = [];
    foreach ($toppings as $i => $option) {
        if (!is_array($option)) continue;
        $id = pos_id($option['id'] ?? ''); $name = clean_text($option['name'] ?? '', 120);
        if ($id === '' || mb_strlen($name) < 1) continue;
        $options[$id] = [$id, $name, max(0, (float)($option['price'] ?? 0)), clean_text($option['emoji'] ?? '✦', 24) ?: '✦',
            pos_option_kind($option), !empty($option['available']) ? 1 : 0, ($i + 1) * 10];
    }
    if (!$items) json_response(['error'=>'No valid menu items in the POS payload.'],400);

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO web_menu_items (id,name,description,price,image,category,available,customizable,sort_order,pasta_count,sauce_count,topping_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),price=VALUES(price),image=VALUES(image),category=VALUES(category),available=VALUES(available),customizable=VALUES(customizable),sort_order=VALUES(sort_order),pasta_count=VALUES(pasta_count),sauce_count=VALUES(sauce_count),topping_count=VALUES(topping_count)');
    foreach ($items as $row) $stmt->execute($row);
    $stmt = $pdo->prepare('INSERT INTO web_options (id,name,price,emoji,kind,available,sort_order) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),price=VALUES(price),emoji=VALUES(emoji),kind=VALUES(kind),available=VALUES(available),sort_order=VALUES(sort_order)');
    foreach ($options as $row) $stmt->execute($row);

    // Remove what the POS no longer has.
    $removeMissing = function (string $table, array $ids) use ($pdo): int {
        if (!$ids) return (int)$pdo->exec("DELETE FROM {$table}");
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE id NOT IN ({$placeholders})");
        $stmt->execute(array_keys($ids));
        return $stmt->rowCount();
    };
    $removedItems = $removeMissing('web_menu_items', $items);
    $removedOptions = $removeMissing('web_options', $options);
    $now = date('Y-m-d H:i:s');
    $pdo->prepare("UPDATE web_settings SET menu_synced_at=? WHERE id='default'")->execute([$now]);
    $pdo->commit();

    json_response(['ok'=>true,'items'=>count($items),'options'=>count($options),'removedItems'=>$removedItems,'removedOptions'=>$removedOptions,'syncedAt'=>$now]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error'=>$e->getMessage()],500);
}
