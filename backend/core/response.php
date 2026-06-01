<?php
declare(strict_types=1);

function allow_cors(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ok($data = null, string $message = 'Thành công'): void
{
    json_response([
        'success' => true,
        'message' => $message,
        'data' => $data,
    ]);
}

function fail(string $message, int $status = 400, $errors = null): void
{
    json_response([
        'success' => false,
        'message' => $message,
        'errors' => $errors,
    ], $status);
}

function input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);

    if (is_array($data)) {
        return $data;
    }

    return $_POST ?: [];
}

function require_fields(array $data, array $fields): void
{
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            $missing[] = $field;
        }
    }

    if ($missing) {
        fail('Vui lòng nhập đầy đủ thông tin.', 422, $missing);
    }
}

function route_method(array $allowed): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, $allowed, true)) {
        fail('Phương thức không được hỗ trợ.', 405);
    }
    return $method;
}
