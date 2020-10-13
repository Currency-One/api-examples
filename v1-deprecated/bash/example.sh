#!/bin/bash

# Credentials
apikey=#...
secret=#...

echo "Current best offers:"
curl "https://api.walutomat.pl/api/v1/public/market/orderbook/EUR_PLN"


if [[ ! -z "$apikey" ]] || [[ ! -z "$secret" ]]; then
  echo -e "\n\nApikey and/or secret is required"
  exit 1
fi

## Check my balance
echo -e "\n\nMy balance:"
uri=/api/v1/account/balances
ts=$(date +%s)000
sign=$(echo -n $uri$ts | openssl dgst -sha256 -binary -hmac $secret | xxd -p -c 256)
curl -H "X-API-KEY: $apikey" \
     -H "X-API-NONCE: $ts" \
     -H "X-API-SIGNATURE: $sign" \
     -X GET "https://api.walutomat.pl$uri"

## Place order
echo -e "\n\nPlacing an order:"
if ! which uuidgen; then
 echo -e '\n\nAn uuid generator (eg. uuidgen) is required to place orders';
 exit 1
fi
uri="/api/v1/market/orders?submitId="`uuidgen`"&pair=EUR_PLN&price=4.231&buySell=BUY&volume=1.00&volumeCurrency=EUR&otherCurrency=PLN"
ts=$(date +%s)001
sign=$(echo -n $uri$ts | openssl dgst -sha256 -binary -hmac $secret | xxd -p -c 256)
curl -H "X-API-KEY: $apikey" \
     -H "X-API-NONCE: $ts" \
     -H "X-API-SIGNATURE: $sign" \
     -X POST "https://api.walutomat.pl$uri"

## Withdraw an order
echo -e "\n\nWithdrawing an order:"
uri=/api/v1/market/orders/close/5137bdb7-acde-41ff-aeb2-0908af0bd3d9
ts=$(date +%s)002
sign=$(echo -n $uri$ts | openssl dgst -sha256 -binary -hmac $secret | xxd -p -c 256)
curl -H "X-API-KEY: $apikey" \
     -H "X-API-NONCE: $ts" \
     -H "X-API-SIGNATURE: $sign" \
     -X POST "https://api.walutomat.pl$uri"