#!/usr/bin/env python3

import requests
import base64
import uuid
import urllib

from OpenSSL import crypto
from datetime import datetime

API_KEY = open('./api_key').read()

## OrderId can be obtained by invoking order-create.py
ORDER_ID = 'ba7354e7-6bfe-4454-bea3-0958516c8932'

assert API_KEY is not None
assert ORDER_ID is not None

API_BASE = 'https://api.walutomat.pl'
URI = '/api/v2.0.0/market_fx/orders/close'

private_key = crypto.load_privatekey(crypto.FILETYPE_PEM, open('./private.key').read())

ts = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

body = {
    'orderId': ORDER_ID,
}

urlencoded = urllib.parse.urlencode(body)
data_to_sign = f'{ts}{URI}{urlencoded}'

signature = crypto.sign(private_key, data_to_sign, 'sha256') 
signature_base_64 = base64.b64encode(signature)

headers = {
  'X-API-Key': API_KEY,
  'X-API-Signature': signature_base_64,
  'X-API-Timestamp': ts,
  'Content-Type': 'application/x-www-form-urlencoded'
}

response = requests.post(f'{API_BASE}{URI}', data = urlencoded, headers = headers)

print(f'Withdrawn order: {response.text}')