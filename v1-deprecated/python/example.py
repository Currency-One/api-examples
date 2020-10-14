#!/usr/bin/env python3

import hashlib
import hmac
import requests
import time
import uuid


API_BASE = 'https://api.walutomat.pl'


# Credentials
api_key = None
secret = None
assert api_key is not None
assert secret is not None

# Get current offers
print('Current best offers:')
print(requests.get(f'{API_BASE}/api/v1/public/market/orderbook/EUR_PLN').text)


# Check my balance
uri = '/api/v1/account/balances'
ts = str(int(time.time() * 1000))
sign = hmac.new(secret, msg=uri + ts, digestmod=hashlib.sha256).hexdigest()
headers = {
  'X-API-KEY': api_key,
  'X-API-NONCE': ts,
  'X-API-SIGNATURE': sign
}
response = requests.get(f'{API_BASE}{uri}', headers=headers).text
print(f'My balance: {response}')


# Place order
uri = '/api/v1/market/orders?submitId={}&pair=EUR_PLN&price=4.231&buySell=BUY&volume=1.00&volumeCurrency=EUR&otherCurrency=PLN'.format(uuid.uuid4())
ts = str(int(time.time() * 1000))
sign = hmac.new(secret, msg=uri + ts, digestmod=hashlib.sha256).hexdigest()
headers = {
  'X-API-KEY': api_key,
  'X-API-NONCE': ts,
  'X-API-SIGNATURE': sign
}
response = requests.post(f'{API_BASE}{uri}', headers=headers).text
print(f'Placing an order: {response}')


# Withdrawing an order
uri = '/api/v1/market/orders/close/5137bdb7-acde-41ff-aeb2-0908af0bd3d9'
ts = str(int(time.time() * 1000))
sign = hmac.new(secret, msg=uri + ts, digestmod=hashlib.sha256).hexdigest()
headers = {
  'X-API-KEY': api_key,
  'X-API-NONCE': ts,
  'X-API-SIGNATURE': sign
}
response = requests.post(f'{API_BASE}{uri}', headers=headers).text
print(f'Withdraw an order: {response}')
