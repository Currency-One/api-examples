<?php

require 'vendor/autoload.php';

use Ramsey\Uuid\Uuid;

$client = new GuzzleHttp\Client();

# Credentials
$apikey = $_SERVER["APIKEY"];
$secret = $_SERVER["SECRET"];

echo $apikey;
# Get current offers

if (!$apikey || !$secret) {
//  throw new Error('apikey and/or secret is required');
}

echo "Current best offers:\n";
$res = $client->request('GET', 'https://api.walutomat.pl/api/v1/public/market/orderbook/EUR_PLN');
echo $res->getBody();


# Check my balance
$uri = '/api/v1/account/balances';
$ts = round(microtime(true) * 1000);
$sign = hash_hmac("sha256", $uri.$ts, $secret);
$headers = [
  'X-API-KEY' => $apikey,
  'X-API-NONCE' => $ts,
  'X-API-SIGNATURE' => $sign
];
$res = $client->request('GET', 'https://api.walutomat.pl'.$uri, ['headers' => $headers]);
echo "\n\nMy balance:\n" . $res->getBody();


# Check my balance
$uri = '/api/v1/market/orders?' . http_build_query([
    'submitId' => (string)Uuid::uuid4(),
    'pair' => 'EUR_PLN',
    'price' => '4.231', 
    'buySell' => 'BUY',
    'volume' => '1.00',
    'volumeCurrency' => 'EUR',
    'otherCurrency' => 'PLN'
]);
$ts = round(microtime(true) * 1000);
$sign = hash_hmac("sha256", $uri.$ts, $secret);
$headers = [
  'X-API-KEY' => $apikey,
  'X-API-NONCE' => $ts,
  'X-API-SIGNATURE' => $sign
];
$res = $client->request('POST', 'https://api.walutomat.pl'.$uri, ['headers' => $headers]);
echo "\n\nPlacing an order:\n" . $res->getBody();

# Withdraw an order
$uri = '/api/v1/market/orders/close/5137bdb7-acde-41ff-aeb2-0908af0bd3d9';
$ts = round(microtime(true) * 1000);
$sign = hash_hmac("sha256", $uri.$ts, $secret);
$headers = [
  'X-API-KEY' => $apikey,
  'X-API-NONCE' => $ts,
  'X-API-SIGNATURE' => $sign
];
$res = $client->request('POST', 'https://api.walutomat.pl'.$uri, ['headers' => $headers]);
echo "\n\nWithdraw an order:\n" . $res->getBody();
