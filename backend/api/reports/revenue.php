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
    'SELECT DATE(ngayTao) AS invoice_date, COUNT(*) AS orders, SUM(tongTien) AS invoice_total
     FROM HoaDon
     WHERE DATE(ngayTao) BETWEEN ? AND ?
     GROUP BY DATE(ngayTao)'
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
    'SELECT DATE(ngayTra) AS return_date, SUM(tongTienHoan) AS return_total
     FROM TraHang
     WHERE DATE(ngayTra) BETWEEN ? AND ?
     GROUP BY DATE(ngayTra)'
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
    'SELECT DATE(ngayDoi) AS exchange_date, SUM(tienBu - tienHoan) AS exchange_total
     FROM DoiHang
     WHERE DATE(ngayDoi) BETWEEN ? AND ?
     GROUP BY DATE(ngayDoi)'
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
