<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type,Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env_file(__DIR__ . '/.env');

const OFFERS_FILE = __DIR__ . '/data/offers.json';
const MENU_ITEMS_FILE = __DIR__ . '/data/menu-items.json';
const INSTAGRAM_FILE = __DIR__ . '/instagram-feed.json';
const UPLOAD_DIR = __DIR__ . '/uploads';
const OFFER_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80';
const MENU_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80';

$DEFAULT_OFFERS = [
    [
        'id' => 'offer-1',
        'title' => 'A5-es jegyzetfuzet',
        'description' => 'Finom, sima lapok es tartos fedel - a mindennapi jegyzeteleshez.',
        'price' => '1490 Ft',
        'tag' => 'Uj',
        'image' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 1,
    ],
    [
        'id' => 'offer-2',
        'title' => 'Fenymasolopapir A4',
        'description' => 'Kivalo minosegu, tiszta nyomatokhoz idealis papir.',
        'price' => '690 Ft',
        'tag' => 'Akcio',
        'image' => 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 2,
    ],
    [
        'id' => 'offer-3',
        'title' => 'Gel toll',
        'description' => 'Sima iras es kellemes tapadas - irodai es otthoni hasznalatra egyarant.',
        'price' => '890 Ft',
        'tag' => 'Nepszeru',
        'image' => 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 3,
    ],
    [
        'id' => 'offer-4',
        'title' => 'Kezi feliratozo filc',
        'description' => 'Eros szinek es gyors munkavegzes - cimkezeshez es dekoraciohoz.',
        'price' => '520 Ft',
        'tag' => 'Szezonalis',
        'image' => 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 4,
    ],
    [
        'id' => 'offer-5',
        'title' => 'Papirboritek keszlet',
        'description' => 'Egyseges, elegans boritekok levelezeshez es ajandekokhoz.',
        'price' => '1290 Ft',
        'tag' => 'Kivalo',
        'image' => 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 5,
    ],
    [
        'id' => 'offer-6',
        'title' => 'Szivacsos jegyzettomb',
        'description' => 'Konnyen hasznalhato, praktikus jegyzettomb a gyors feljegyzesekhez.',
        'price' => '980 Ft',
        'tag' => 'Ajanlat',
        'image' => 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 6,
    ],
];

$DEFAULT_MENU_ITEMS = [
    [
        'id' => 'menu-item-1',
        'name' => 'Signature Notebooks',
        'description' => 'Soft-touch covers and linen paper',
        'price' => '14',
        'image' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 1,
    ],
    [
        'id' => 'menu-item-2',
        'name' => 'Letterpress Cards',
        'description' => 'Hand-finished cards for every occasion',
        'price' => '6',
        'image' => 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
        'published' => true,
        'sortOrder' => 2,
    ],
];

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = normalize_request_path();
$basePath = get_base_path();

if ($method === 'GET' && $path === '/') {
    header('Location: ' . $basePath . '/admin', true, 302);
    exit;
}

if ($method === 'GET' && $path === '/admin') {
    $adminHtmlPath = __DIR__ . '/admin.html';
    if (!is_file($adminHtmlPath)) {
        json_response(404, ['error' => 'Admin page not found']);
    }
    header('Content-Type: text/html; charset=utf-8');
    readfile($adminHtmlPath);
    exit;
}

if ($method === 'GET' && $path === '/health') {
    json_response(200, ['status' => 'ok']);
}

if ($method === 'GET' && $path === '/api/content-events') {
    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache, no-transform');
    header('Connection: keep-alive');
    echo ": connected\n\n";
    echo "retry: 1000\n\n";
    echo "event: content-changed\n";
    echo "data: {\"type\":\"content\"}\n\n";
    @ob_flush();
    @flush();
    exit;
}

if ($method === 'GET' && $path === '/api/offers') {
    json_response(200, array_values(array_filter(read_offers($DEFAULT_OFFERS), static fn($o) => ($o['published'] ?? true) !== false)));
}

if ($method === 'GET' && $path === '/api/offers/admin') {
    require_admin_auth();
    json_response(200, read_offers($DEFAULT_OFFERS));
}

if ($method === 'POST' && $path === '/api/offers') {
    require_admin_auth();
    $payload = read_json_body();
    $offer = create_offer($payload, $DEFAULT_OFFERS);
    json_response(201, $offer);
}

if ($method === 'PUT' && starts_with($path, '/api/offers/')) {
    require_admin_auth();
    $payload = read_json_body();
    $id = basename($path);
    $offer = update_offer($id, $payload, $DEFAULT_OFFERS);
    json_response(200, $offer);
}

if ($method === 'DELETE' && starts_with($path, '/api/offers/')) {
    require_admin_auth();
    $id = basename($path);
    delete_offer($id, $DEFAULT_OFFERS);
    json_response(200, ['success' => true]);
}

if ($method === 'GET' && $path === '/api/menu-items') {
    json_response(200, array_values(array_filter(read_menu_items($DEFAULT_MENU_ITEMS), static fn($o) => ($o['published'] ?? true) !== false)));
}

if ($method === 'GET' && $path === '/api/menu-items/admin') {
    require_admin_auth();
    json_response(200, read_menu_items($DEFAULT_MENU_ITEMS));
}

if ($method === 'POST' && $path === '/api/menu-items') {
    require_admin_auth();
    $payload = read_json_body();
    $item = create_menu_item($payload, $DEFAULT_MENU_ITEMS);
    json_response(201, $item);
}

if ($method === 'PUT' && starts_with($path, '/api/menu-items/')) {
    require_admin_auth();
    $payload = read_json_body();
    $id = basename($path);
    $item = update_menu_item($id, $payload, $DEFAULT_MENU_ITEMS);
    json_response(200, $item);
}

if ($method === 'DELETE' && starts_with($path, '/api/menu-items/')) {
    require_admin_auth();
    $id = basename($path);
    delete_menu_item($id, $DEFAULT_MENU_ITEMS);
    json_response(200, ['success' => true]);
}

if ($method === 'POST' && $path === '/api/upload') {
    require_admin_auth();

    if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
        json_response(400, ['error' => 'No file uploaded']);
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0775, true);
    }

    $originalName = $_FILES['file']['name'] ?? 'upload';
    $savedName = build_upload_file_name($originalName);
    $targetPath = UPLOAD_DIR . '/' . $savedName;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
        json_response(500, ['error' => 'Unable to save upload']);
    }

    json_response(201, ['fileName' => $savedName, 'url' => $basePath . '/uploads/' . $savedName]);
}

if ($method === 'GET' && $path === '/api/instagram-feed') {
    $posts = read_instagram_posts();
    $visible = array_values(array_filter($posts, static fn($post) => ($post['published'] ?? true) !== false));
    json_response(200, ['posts' => $visible]);
}

if ($method === 'GET' && $path === '/api/instagram-feed/admin') {
    require_admin_auth();
    json_response(200, read_instagram_posts());
}

if ($method === 'POST' && $path === '/api/instagram-feed') {
    require_admin_auth();
    $payload = read_json_body();
    $post = create_instagram_post($payload);
    json_response(201, $post);
}

if ($method === 'PUT' && starts_with($path, '/api/instagram-feed/')) {
    require_admin_auth();
    $payload = read_json_body();
    $id = basename($path);
    $post = update_instagram_post($id, $payload);
    json_response(200, $post);
}

if ($method === 'DELETE' && starts_with($path, '/api/instagram-feed/')) {
    require_admin_auth();
    $id = basename($path);
    delete_instagram_post($id);
    json_response(200, ['deleted' => true, 'id' => $id]);
}

if ($method === 'POST' && $path === '/api/instagram-webhook') {
    $payload = read_json_body();
    $post = upsert_instagram_post($payload);
    json_response(200, $post);
}

if ($method === 'POST' && $path === '/api/instagram-feed/import') {
    require_admin_auth();
    $payload = read_json_body();
    $profileUrl = trim((string)($payload['profileUrl'] ?? ''));
    $importedPosts = import_instagram_posts_from_profile($profileUrl);
    json_response(200, [
        'count' => count($importedPosts),
        'posts' => $importedPosts,
        'message' => count($importedPosts) > 0 ? 'Posztok importalva.' : 'Nem talaltunk valos Instagram posztot.',
    ]);
}

json_response(404, ['error' => 'Not found']);

function normalize_request_path(): string
{
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');

    if ($scriptDir !== '' && $scriptDir !== '/' && starts_with($requestPath, $scriptDir)) {
        $requestPath = substr($requestPath, strlen($scriptDir));
    }

    if ($requestPath === '' || $requestPath === false) {
        return '/';
    }

    return $requestPath;
}

function get_base_path(): string
{
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $scriptDir = rtrim($scriptDir, '/');

    if ($scriptDir === '' || $scriptDir === '.') {
        return '';
    }

    return $scriptDir;
}

function starts_with(string $haystack, string $needle): bool
{
    return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
}

function ends_with(string $haystack, string $needle): bool
{
    if ($needle === '') {
        return true;
    }

    $haystackLength = strlen($haystack);
    $needleLength = strlen($needle);

    if ($needleLength > $haystackLength) {
        return false;
    }

    return substr($haystack, -$needleLength) === $needle;
}

function json_response(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_response(400, ['error' => 'Invalid JSON body']);
    }

    return $decoded;
}

function load_env_file(string $filePath): void
{
    if (!is_file($filePath)) {
        return;
    }

    $raw = file_get_contents($filePath);
    if ($raw === false) {
        return;
    }

    foreach (preg_split('/\r?\n/', $raw) as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || starts_with($trimmed, '#')) {
            continue;
        }

        $pos = strpos($trimmed, '=');
        if ($pos === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $pos));
        $value = trim(substr($trimmed, $pos + 1));

        if ($key === '' || getenv($key) !== false) {
            continue;
        }

        if (
            (starts_with($value, '"') && ends_with($value, '"')) ||
            (starts_with($value, "'") && ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

function env_value(string $name, ?string $default = null): ?string
{
    $value = getenv($name);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }
    return $value;
}

function require_admin_auth(): void
{
    $adminUsername = env_value('ADMIN_USERNAME');
    $adminPassword = env_value('ADMIN_PASSWORD');

    if ($adminUsername === null || $adminPassword === null) {
        json_response(500, ['error' => 'Missing ADMIN_USERNAME or ADMIN_PASSWORD']);
    }

    $authHeader = get_authorization_header();
    $expected = 'Basic ' . base64_encode($adminUsername . ':' . $adminPassword);

    if ($authHeader === $expected) {
        return;
    }

    header('WWW-Authenticate: Basic realm="Offer Admin"');
    json_response(401, ['error' => 'Unauthorized']);
}

function get_authorization_header(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($header !== '') {
        return $header;
    }

    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strcasecmp($key, 'Authorization') === 0) {
                return (string)$value;
            }
        }
    }

    return '';
}

function ensure_data_file(string $path, array $defaultData): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    if (!is_file($path)) {
        file_put_contents($path, json_encode($defaultData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return;
    }

    $raw = file_get_contents($path);
    $decoded = json_decode((string)$raw, true);
    if (!is_array($decoded) || count($decoded) === 0) {
        file_put_contents($path, json_encode($defaultData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

function read_json_array_file(string $path, array $defaultData, bool $allowEmptyAsDefault = false): array
{
    ensure_data_file($path, $defaultData);

    $raw = file_get_contents($path);
    $decoded = json_decode((string)$raw, true);
    $items = is_array($decoded) ? $decoded : $defaultData;

    if ($allowEmptyAsDefault && count($items) === 0) {
        return $defaultData;
    }

    return $items;
}

function write_json_array_file(string $path, array $items): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    file_put_contents($path, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function normalize_published(mixed $value, bool $fallback = true): bool
{
    if (is_bool($value)) {
        return $value;
    }

    if (is_string($value)) {
        return strtolower($value) !== 'false';
    }

    return $fallback;
}

function normalize_sort_order(mixed $value, int $fallback): int
{
    if (is_numeric($value)) {
        return (int)$value;
    }

    return $fallback;
}

function read_offers(array $defaultOffers): array
{
    $offers = read_json_array_file(OFFERS_FILE, $defaultOffers, true);

    $normalized = array_map(static function (array $offer): array {
        $offer['published'] = normalize_published($offer['published'] ?? true, true);
        $offer['sortOrder'] = normalize_sort_order($offer['sortOrder'] ?? null, 999);
        return $offer;
    }, $offers);

    usort($normalized, static fn(array $a, array $b) => ($a['sortOrder'] ?? 999) <=> ($b['sortOrder'] ?? 999));
    return $normalized;
}

function validate_offer_payload(array $payload): array
{
    $title = trim((string)($payload['title'] ?? ''));
    $description = trim((string)($payload['description'] ?? ''));
    $price = trim((string)($payload['price'] ?? ''));
    $tag = trim((string)($payload['tag'] ?? ''));
    $image = trim((string)($payload['image'] ?? ''));

    if ($title === '' || $description === '' || $price === '' || $tag === '') {
        json_response(400, ['error' => 'Nev, leiras, ar es cimke megadasa kotelezo.']);
    }

    return [
        'title' => $title,
        'description' => $description,
        'price' => $price,
        'tag' => $tag,
        'image' => $image,
    ];
}

function create_offer(array $payload, array $defaultOffers): array
{
    $offers = read_offers($defaultOffers);
    $validated = validate_offer_payload($payload);

    $offer = [
        'id' => trim((string)($payload['id'] ?? '')) ?: ('offer-' . (string)time() . '-' . random_int(100, 999)),
        'title' => $validated['title'],
        'description' => $validated['description'],
        'price' => $validated['price'],
        'tag' => $validated['tag'],
        'image' => $validated['image'] !== '' ? $validated['image'] : OFFER_PLACEHOLDER_IMAGE,
        'published' => normalize_published($payload['published'] ?? true, true),
        'sortOrder' => normalize_sort_order($payload['sortOrder'] ?? null, count($offers) + 1),
    ];

    array_unshift($offers, $offer);
    write_json_array_file(OFFERS_FILE, $offers);
    return $offer;
}

function update_offer(string $id, array $payload, array $defaultOffers): array
{
    $offers = read_offers($defaultOffers);
    $index = null;
    foreach ($offers as $i => $offer) {
        if (($offer['id'] ?? '') === $id) {
            $index = $i;
            break;
        }
    }

    if ($index === null) {
        json_response(404, ['error' => 'Az ajanlat nem talalhato']);
    }

    $validated = validate_offer_payload($payload);
    $current = $offers[$index];

    $updated = [
        'id' => $id,
        'title' => $validated['title'],
        'description' => $validated['description'],
        'price' => $validated['price'],
        'tag' => $validated['tag'],
        'image' => $validated['image'] !== '' ? $validated['image'] : ($current['image'] ?? OFFER_PLACEHOLDER_IMAGE),
        'published' => array_key_exists('published', $payload)
            ? normalize_published($payload['published'], true)
            : normalize_published($current['published'] ?? true, true),
        'sortOrder' => array_key_exists('sortOrder', $payload)
            ? normalize_sort_order($payload['sortOrder'], (int)($current['sortOrder'] ?? 999))
            : normalize_sort_order($current['sortOrder'] ?? null, 999),
    ];

    $offers[$index] = $updated;
    write_json_array_file(OFFERS_FILE, $offers);
    return $updated;
}

function delete_offer(string $id, array $defaultOffers): void
{
    $offers = read_offers($defaultOffers);
    $next = array_values(array_filter($offers, static fn(array $offer): bool => ($offer['id'] ?? '') !== $id));

    if (count($next) === count($offers)) {
        json_response(404, ['error' => 'Az ajanlat nem talalhato']);
    }

    write_json_array_file(OFFERS_FILE, $next);
}

function read_menu_items(array $defaultMenuItems): array
{
    $items = read_json_array_file(MENU_ITEMS_FILE, $defaultMenuItems);

    $normalized = array_map(static function (array $item): array {
        $item['published'] = normalize_published($item['published'] ?? true, true);
        $item['sortOrder'] = normalize_sort_order($item['sortOrder'] ?? null, 999);
        return $item;
    }, $items);

    usort($normalized, static fn(array $a, array $b) => ($a['sortOrder'] ?? 999) <=> ($b['sortOrder'] ?? 999));
    return $normalized;
}

function validate_menu_item_payload(array $payload): array
{
    $name = trim((string)($payload['name'] ?? ''));
    $description = trim((string)($payload['description'] ?? ''));
    $price = trim((string)($payload['price'] ?? ''));
    $image = trim((string)($payload['image'] ?? ''));

    if ($name === '' || $description === '' || $price === '') {
        json_response(400, ['error' => 'Nev, leiras es ar megadasa kotelezo.']);
    }

    return [
        'name' => $name,
        'description' => $description,
        'price' => $price,
        'image' => $image,
    ];
}

function create_menu_item(array $payload, array $defaultMenuItems): array
{
    $items = read_menu_items($defaultMenuItems);
    $validated = validate_menu_item_payload($payload);

    $item = [
        'id' => trim((string)($payload['id'] ?? '')) ?: ('menu-item-' . (string)time() . '-' . random_int(100, 999)),
        'name' => $validated['name'],
        'description' => $validated['description'],
        'price' => $validated['price'],
        'image' => $validated['image'] !== '' ? $validated['image'] : MENU_PLACEHOLDER_IMAGE,
        'published' => normalize_published($payload['published'] ?? true, true),
        'sortOrder' => normalize_sort_order($payload['sortOrder'] ?? null, count($items) + 1),
    ];

    array_unshift($items, $item);
    write_json_array_file(MENU_ITEMS_FILE, $items);
    return $item;
}

function update_menu_item(string $id, array $payload, array $defaultMenuItems): array
{
    $items = read_menu_items($defaultMenuItems);
    $index = null;
    foreach ($items as $i => $item) {
        if (($item['id'] ?? '') === $id) {
            $index = $i;
            break;
        }
    }

    if ($index === null) {
        json_response(404, ['error' => 'A menuelem nem talalhato']);
    }

    $validated = validate_menu_item_payload($payload);
    $current = $items[$index];

    $updated = [
        'id' => $id,
        'name' => $validated['name'],
        'description' => $validated['description'],
        'price' => $validated['price'],
        'image' => $validated['image'] !== '' ? $validated['image'] : ($current['image'] ?? MENU_PLACEHOLDER_IMAGE),
        'published' => array_key_exists('published', $payload)
            ? normalize_published($payload['published'], true)
            : normalize_published($current['published'] ?? true, true),
        'sortOrder' => array_key_exists('sortOrder', $payload)
            ? normalize_sort_order($payload['sortOrder'], (int)($current['sortOrder'] ?? 999))
            : normalize_sort_order($current['sortOrder'] ?? null, 999),
    ];

    $items[$index] = $updated;
    write_json_array_file(MENU_ITEMS_FILE, $items);
    return $updated;
}

function delete_menu_item(string $id, array $defaultMenuItems): void
{
    $items = read_menu_items($defaultMenuItems);
    $next = array_values(array_filter($items, static fn(array $item): bool => ($item['id'] ?? '') !== $id));

    if (count($next) === count($items)) {
        json_response(404, ['error' => 'A menuelem nem talalhato']);
    }

    write_json_array_file(MENU_ITEMS_FILE, $next);
}

function read_instagram_posts(): array
{
    if (!is_file(INSTAGRAM_FILE)) {
        return [];
    }

    $raw = file_get_contents(INSTAGRAM_FILE);
    $decoded = json_decode((string)$raw, true);
    $posts = is_array($decoded) ? $decoded : [];

    return array_map(static function (array $post): array {
        $post['published'] = normalize_published($post['published'] ?? true, true);
        return $post;
    }, $posts);
}

function write_instagram_posts(array $posts): void
{
    write_json_array_file(INSTAGRAM_FILE, $posts);
}

function normalize_instagram_post(array $input, string $fallbackTimestamp): array
{
    $id = trim((string)($input['id'] ?? ''));
    if ($id === '') {
        $id = 'post-' . time() . '-' . random_int(100, 999);
    }

    $caption = trim((string)($input['caption'] ?? ''));
    $mediaUrl = trim((string)($input['mediaUrl'] ?? ''));
    $permalink = trim((string)($input['permalink'] ?? ''));
    $timestamp = trim((string)($input['timestamp'] ?? ''));

    return [
        'id' => $id,
        'caption' => $caption !== '' ? $caption : 'Instagram poszt',
        'mediaUrl' => $mediaUrl,
        'permalink' => $permalink,
        'timestamp' => $timestamp !== '' ? $timestamp : $fallbackTimestamp,
        'published' => normalize_published($input['published'] ?? true, true),
    ];
}

function create_instagram_post(array $payload): array
{
    $posts = read_instagram_posts();
    $post = normalize_instagram_post($payload, gmdate('c'));
    array_unshift($posts, $post);
    write_instagram_posts($posts);
    return $post;
}

function update_instagram_post(string $id, array $payload): array
{
    $posts = read_instagram_posts();
    $index = null;

    foreach ($posts as $i => $post) {
        if (($post['id'] ?? '') === $id) {
            $index = $i;
            break;
        }
    }

    if ($index === null) {
        json_response(404, ['error' => 'Instagram post not found']);
    }

    $current = $posts[$index];
    $updated = normalize_instagram_post(array_merge($current, $payload, ['id' => $id]), (string)($current['timestamp'] ?? gmdate('c')));
    $posts[$index] = $updated;
    write_instagram_posts($posts);
    return $updated;
}

function delete_instagram_post(string $id): void
{
    $posts = read_instagram_posts();
    $next = array_values(array_filter($posts, static fn(array $post): bool => ($post['id'] ?? '') !== $id));

    if (count($next) === count($posts)) {
        json_response(404, ['error' => 'Instagram post not found']);
    }

    write_instagram_posts($next);
}

function upsert_instagram_post(array $payload): array
{
    $posts = read_instagram_posts();
    $timestamp = trim((string)($payload['timestamp'] ?? '')) ?: gmdate('c');
    $id = trim((string)($payload['id'] ?? ''));
    if ($id === '') {
        $id = 'post-' . time() . '-' . random_int(100, 999);
    }

    $existingIndex = null;
    foreach ($posts as $i => $post) {
        if (($post['id'] ?? '') === $id || (($post['permalink'] ?? '') !== '' && ($post['permalink'] ?? '') === ($payload['permalink'] ?? ''))) {
            $existingIndex = $i;
            break;
        }
    }

    $next = normalize_instagram_post(array_merge($payload, ['id' => $id, 'timestamp' => $timestamp]), $timestamp);

    if ($existingIndex !== null) {
        $posts[$existingIndex] = $next;
    } else {
        array_unshift($posts, $next);
    }

    write_instagram_posts($posts);
    return $next;
}

function extract_instagram_username(string $profileUrl): ?string
{
    if ($profileUrl === '') {
        return null;
    }

    $parts = parse_url($profileUrl);
    if (!is_array($parts) || !isset($parts['path'])) {
        return null;
    }

    $segments = array_values(array_filter(explode('/', (string)$parts['path'])));
    if (count($segments) === 0) {
        return null;
    }

    $first = $segments[0];
    if (in_array($first, ['p', 'reel', 'tv'], true)) {
        return null;
    }

    return $first;
}

function fetch_instagram_resource(string $pathname): ?array
{
    $url = 'https://www.instagram.com' . $pathname;
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0\r\nAccept: application/json, text/plain, */*\r\n",
            'timeout' => 15,
            'ignore_errors' => true,
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    if (!is_string($body) || trim($body) === '') {
        return null;
    }

    $decoded = json_decode($body, true);
    if (is_array($decoded)) {
        return $decoded;
    }

    if (preg_match('/window\._sharedData\s*=\s*({.*?});/s', $body, $matches) === 1) {
        $fallback = json_decode($matches[1], true);
        if (is_array($fallback)) {
            return $fallback;
        }
    }

    return null;
}

function extract_instagram_post_nodes(array $payload): array
{
    $nodes = [];

    $shortcodeMedia = $payload['graphql']['shortcode_media'] ?? null;
    if (is_array($shortcodeMedia)) {
        $nodes[] = $shortcodeMedia;
    }

    $profile = $payload['graphql']['user']
        ?? $payload['data']['user']
        ?? $payload['entry_data']['ProfilePage'][0]['graphql']['user']
        ?? null;

    if (is_array($profile)) {
        $timelineEdges = $profile['edge_owner_to_timeline_media']['edges'] ?? [];
        if (is_array($timelineEdges)) {
            foreach ($timelineEdges as $edge) {
                if (is_array($edge['node'] ?? null)) {
                    $nodes[] = $edge['node'];
                }
            }
        }

        $felixEdges = $profile['edge_felix_video_timeline']['edges'] ?? [];
        if (is_array($felixEdges)) {
            foreach ($felixEdges as $edge) {
                if (is_array($edge['node'] ?? null)) {
                    $nodes[] = $edge['node'];
                }
            }
        }
    }

    return $nodes;
}

function import_instagram_posts_from_profile(string $profileUrl): array
{
    $trimmed = trim($profileUrl);
    if ($trimmed === '') {
        return [];
    }

    $segments = array_values(array_filter(explode('/', parse_url($trimmed, PHP_URL_PATH) ?: '')));
    $isDirect = isset($segments[0]) && in_array($segments[0], ['p', 'reel', 'tv'], true);
    $shortcode = $isDirect ? ($segments[1] ?? '') : '';

    $payload = null;
    if ($shortcode !== '') {
        $payload = fetch_instagram_resource('/p/' . rawurlencode($shortcode) . '/?__a=1&__d=dis');
    } else {
        $username = extract_instagram_username($trimmed);
        if ($username !== null) {
            $payload = fetch_instagram_resource('/' . rawurlencode($username) . '/?__a=1&__d=dis');
        }
    }

    if (!is_array($payload)) {
        return [];
    }

    $nodes = extract_instagram_post_nodes($payload);
    $imported = [];

    foreach ($nodes as $node) {
        if (!is_array($node)) {
            continue;
        }

        $shortcodeValue = trim((string)($node['shortcode'] ?? ''));
        if ($shortcodeValue === '') {
            continue;
        }

        $caption = '';
        $captionEdges = $node['edge_media_to_caption']['edges'] ?? [];
        if (is_array($captionEdges)) {
            $captions = [];
            foreach ($captionEdges as $edge) {
                $text = trim((string)($edge['node']['text'] ?? ''));
                if ($text !== '') {
                    $captions[] = $text;
                }
            }
            $caption = trim(implode("\n", $captions));
        }

        $mediaUrl = trim((string)($node['display_url'] ?? ''));
        if ($mediaUrl === '') {
            $mediaUrl = trim((string)($node['thumbnail_src'] ?? ''));
        }

        $timestamp = isset($node['taken_at_timestamp']) && is_numeric($node['taken_at_timestamp'])
            ? gmdate('c', (int)$node['taken_at_timestamp'])
            : gmdate('c');

        $postPayload = [
            'id' => $shortcodeValue,
            'caption' => $caption !== '' ? $caption : trim((string)($node['accessibility_caption'] ?? '')),
            'mediaUrl' => $mediaUrl,
            'permalink' => 'https://www.instagram.com/p/' . $shortcodeValue . '/',
            'timestamp' => $timestamp,
            'published' => true,
        ];

        if ($postPayload['caption'] !== '' || $postPayload['mediaUrl'] !== '' || $postPayload['permalink'] !== '') {
            $imported[] = upsert_instagram_post($postPayload);
        }
    }

    return $imported;
}

function build_upload_file_name(string $originalName): string
{
    $pathInfo = pathinfo($originalName);
    $extension = isset($pathInfo['extension']) ? '.' . strtolower((string)$pathInfo['extension']) : '';
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '-', (string)($pathInfo['filename'] ?? 'upload'));
    $filename = trim((string)$filename, '-');

    if ($filename === '') {
        $filename = 'upload';
    }

    return $filename . '-' . time() . '-' . random_int(100, 999) . $extension;
}
