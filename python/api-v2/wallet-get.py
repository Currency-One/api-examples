#!/usr/bin/env python3

import requests
import base64

from OpenSSL import crypto
from datetime import datetime

API_KEY = open('./api_key').read()
assert API_KEY is not None

API_BASE = 'https://api.walutomat.pl'
URI = '/api/v2.0.0/account/balances'

private_key = crypto.load_privatekey(crypto.FILETYPE_PEM, open('./private.key').read())

ts = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
data_to_sign = f'{ts}{URI}'

signature = crypto.sign(private_key, data_to_sign, 'sha256') 
signature_base64 = base64.b64encode(signature)

headers = {
  'X-API-Key': API_KEY,
  'X-API-Signature': signature_base64,
  'X-API-Timestamp': ts
}

response = requests.get(f'{API_BASE}{URI}', headers = headers).text

print(f'Your current wallet balance is: {response}')
