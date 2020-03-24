#!/usr/bin/env python3

import requests
import base64
import uuid
import urllib

from OpenSSL import crypto
from datetime import datetime

API_KEY = open('./api_key').read()
assert API_KEY is not None

API_BASE = 'https://api.walutomat.pl'
URI = '/api/v2.0.0/market_fx/orders'

private_key = crypto.load_privatekey(crypto.FILETYPE_PEM, open('./private.key').read())

ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
submitId = uuid.uuid4()

body = {
    'currencyPair': 'EURPLN',
    'buySell': 'BUY',
    'volume': '90.00',
    'volumeCurrency': 'EUR',
    'limitPrice': '4.2456',
    'dryRun': 'false',
    'submitId': submitId
}

urlencoded = urllib.parse.urlencode(body)
dataToSign = f'{ts}{URI}{urlencoded}'

signature = crypto.sign(private_key, dataToSign, "sha256") 
signatureBase64 = base64.b64encode(signature)

headers = {
  'X-API-Key': API_KEY,
  'X-API-Signature': signatureBase64,
  'X-API-Timestamp': ts,
  'Content-Type': 'application/x-www-form-urlencoded'
}

response = requests.post(f'{API_BASE}{URI}', data = urlencoded, headers = headers)

print(f'Created order: {response.text}')