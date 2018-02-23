#!/usr/bin/env python

import requests
import time
import hmac
import hashlib
import uuid

# Credentials
apikey=None
secret=None

# Get current offers
print 'Current best offers:'
r = requests.get('https://api.walutomat.pl/api/v1/public/market/orderbook/EUR_PLN')
print r.text

if not apikey or not secret:
  raise Error('apikey and/or secret is required')

# Check my balance
uri = '/api/v1/account/balances'
ts = str(int(time.time()*1000))
sign = hmac.new(secret, msg=uri+ts, digestmod=hashlib.sha256).hexdigest()
headers = {
  'X-API-KEY': apikey,
  'X-API-NONCE': ts,
  'X-API-SIGNATURE': sign
}
r = requests.get('https://api.walutomat.pl'+uri, headers=headers)
print 'My balance: ' + r.text

# Place order
uri = '/api/v1/market/orders?submitId='+str(uuid.uuid4())+'&pair=EUR_PLN&price=4.231&buySell=BUY&volume=1.00&volumeCurrency=EUR&otherCurrency=PLN'
ts = str(int(time.time()*1000))
sign = hmac.new(secret, msg=uri+ts, digestmod=hashlib.sha256).hexdigest()
headers = {
  'X-API-KEY': apikey,
  'X-API-NONCE': ts,
  'X-API-SIGNATURE': sign
}
r = requests.post('https://api.walutomat.pl'+uri, headers=headers)
print 'Placing an order: ' + r.text

# Withdrawing an order
uri = '/api/v1/market/orders/close/5137bdb7-acde-41ff-aeb2-0908af0bd3d9'
ts = str(int(time.time()*1000))
sign = hmac.new(secret, msg=uri+ts, digestmod=hashlib.sha256).hexdigest()
headers = {
  'X-API-KEY': apikey,
  'X-API-NONCE': ts,
  'X-API-SIGNATURE': sign
}
r = requests.post('https://api.walutomat.pl'+uri, headers=headers)
print 'Withdraw an order: ' + r.text
