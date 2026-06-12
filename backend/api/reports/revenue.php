<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$from = $_GET['from'] ?? date('Y-m-01');
$to = $_GET['to'] ?? date('Y-m-d');

$dataMap = [];

// 1. Invoices
$stmt = db()->prepare(
    'SELECT invoice_date, COUNT(*) AS orders, SUM(total) AS invoice_total
     FROM invoices
     WHERE invoice_date BETWEEN ? AND ?
     GROUP BY invoice_date'
);
$stmt->execute([$from, $to]);
foreach ($stmt->fetchAll() as $row) {
    $date = $row['invoice_date'];
    $dataMap[$date] = [
        'invoice_date' => $date,
        'orders' => (int)$row['orders'],
        'invoice_total' => (float)$row['invoice_total'],
        'return_total' => 0.0,
        'exchange_total' => 0.0,
        'revenue' => 0.0
    ];
}

// 2. Returns
$stmt = db()->prepare(
    'SELECT return_date, SUM(refund_amount) AS return_total
     FROM returns
     WHERE return_date BETWEEN ? AND ?
     GROUP BY return_date'
);
$stmt->execute([$from, $to]);
foreach ($stmt->fetchAll() as $row) {
    $date = $row['return_date'];
    if (!isset($dataMap[$date])) {
        $dataMap[$date] = [
            'invoice_date' => $date,
            'orders' => 0,
            'invoice_total' => 0.0,
            'return_total' => 0.0,
            'exchange_total' => 0.0,
            'revenue' => 0.0
        ];
    }
    $dataMap[$date]['return_total'] += (float)$row['return_total'];
}

// 3. Exchanges
$stmt = db()->prepare(
    'SELECT e.exchange_date, SUM((COALESCE(new_p.price, 0) - COALESCE(old_p.price, 0)) * e.quantity) AS exchange_total
     FROM exchanges e
     LEFT JOIN products old_p ON e.old_product_id = old_p.id
     LEFT JOIN products new_p ON e.new_product_id = new_p.id
     WHERE e.exchange_date BETWEEN ? AND ?
     GROUP BY e.exchange_date'
);
$stmt->execute([$from, $to]);
foreach ($stmt->fetchAll() as $row) {
    $date = $row['exchange_date'];
    if (!isset($dataMap[$date])) {
        $dataMap[$date] = [
            'invoice_date' => $date,
            'orders' => 0,
            'invoice_total' => 0.0,
            'return_total' => 0.0,
            'exchange_total' => 0.0,
            'revenue' => 0.0
        ];
    }
    $dataMap[$date]['exchange_total'] += (float)$row['exchange_total'];
}

// Compute net revenue
foreach ($dataMap as $date => &$item) {
    $item['revenue'] = $item['invoice_total'] - $item['return_total'] + $item['exchange_total'];
}

ksort($dataMap);

ok(array_values($dataMap));
