<?php
/**
 * Lead relay — receives this site's form submission (same-origin, from leads.js)
 * and forwards it server-to-server to the DAS admin at
 * https://www.dasandpartnersengineering.com/api/contact, tagged with this site's
 * source key. Server-to-server = no browser Origin, so it isn't blocked by the
 * DAS API's cross-site CSRF guard, and the browser stays same-origin (no CORS).
 */
header('Content-Type: application/json; charset=utf-8');

$SOURCE   = 'abudhabi-approval';
$ENDPOINT = 'https://www.dasandpartnersengineering.com/api/contact';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method not allowed']); exit;
}

// Accept JSON (leads.js) or form-encoded
$raw = file_get_contents('php://input');
$in  = [];
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $in = json_decode($raw, true) ?: [];
} else {
    $in = $_POST;
}
function relay_f($a, $k) { return trim((string)($a[$k] ?? '')); }

// Honeypot: bots fill the hidden "website" field; humans leave it empty
if (relay_f($in, 'website') !== '') { echo json_encode(['ok' => true]); exit; }

$name  = relay_f($in, 'name');
$email = relay_f($in, 'email');
if ($name === '' || $email === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please provide your name and email.']); exit;
}

$payload = json_encode([
    'name'    => $name,
    'email'   => $email,
    'phone'   => relay_f($in, 'phone'),
    'company' => relay_f($in, 'company'),
    'service' => relay_f($in, 'service'),
    'message' => relay_f($in, 'message'),
    'source'  => $SOURCE,
]);

$ok = false;
if (function_exists('curl_init')) {
    $ch = curl_init($ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_POSTREDIR      => 7, // re-POST across 301/302/303 (www<->non-www)
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $ok = ($code >= 200 && $code < 300);
} else {
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\n",
        'content'       => $payload,
        'timeout'       => 8,
        'ignore_errors' => true,
    ]]);
    $resp = @file_get_contents($ENDPOINT, false, $ctx);
    $ok = false;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $c = (int)$m[1]; $ok = ($c >= 200 && $c < 300);
    } else { $ok = ($resp !== false); }
}

if ($ok) {
    echo json_encode(['ok' => true, 'message' => 'Thank you — your enquiry has been received.']);
} else {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'Could not send right now. Please try again or email us directly.']);
}
