#!/usr/bin/env python
#
# This example program uses walutomat API to watch a currency pair on Walutomat market and keep placing best offer. 
# It uses price limit to avoid placing offers too close to Forex rate. It also automatically cancels all not best offers.
#
# Program runs on CHF_PLN pair, always tries to sell 0.10 CHF at price 0.0001 better than others, but not closer than 0.0040 from FX.
#
# Program steps:
# Program runs a loop every 5 secs with following steps:
# 1. Gets current FX rate from Walutomat website
# 2. Gets current best offer at selected currency pair
# 3. Gets current list of user's own active offers
# 4. Checks if any of users own offers is best offer. If not, then places new offer, at price 1 pips better, but no closer than 40 pips to FX rate
# 5. Cancels all other users own offers that are not best.
#
# Keep in mind that this is just an example program, you are using it at your own risk.
#
# Usage:
# APIKEY=myapikey SECRET=myapisecret python example-always-best-price.py
#

import hashlib
import hmac
import os
import requests
import time
import uuid


# Program parameters
pair = 'CHF_PLN'
volume = '0.10'
volumeCurrency = 'CHF'
otherCurrency = 'PLN'
pricePips = 0.0001
priceLimitPips = 0.0040


# Credentials
apikey=os.environ['APIKEY']
secret=os.environ['SECRET']

if not apikey or not secret:
  raise Error('APIKEY and/or SECRET is missing')

def main():
  while True:
    loopStep()
    time.sleep(5)


def loopStep():
  forexRate = getForexRate(pair)
  bestPrice = getBestSellPrice(pair, volumeCurrency == pair[:3])
  delta = -1 if volumeCurrency == pair[:3] else 1 # figure out if we're minimizing or maximizing the price

  orders = request('/api/v1/market/orders/')
  existingOrders = filter(lambda order: 
    order['market'] == pair 
    and order['buySell'] == 'SELL' 
    and order['volumeCurrency'] == volumeCurrency, orders)
  ordersAtNotBestPrice = filter(lambda order: bestPrice + delta * float(order['price']) < 0, existingOrders)
  ordersAtBestPrice = filter(lambda order: bestPrice + delta * float(order['price']) == 0, existingOrders)
  
  print('{0} SELL {1}, forex: {2}, current best: {3}, orders at best price: {4}, orders to cancel: {5}'
    .format(pair, volumeCurrency, forexRate, bestPrice, len(ordersAtBestPrice), len(ordersAtNotBestPrice)))

  if not ordersAtBestPrice:
    placementPrice = float(bestPrice) + delta * pricePips
    if abs(forexRate - placementPrice) < priceLimitPips:
      print('not placing, closer than {0} to forex'.format(priceLimitPips))
    print('placing order {0}'.format(placementPrice))
    placement = 'pair={0}&price={1}&buySell=SELL&volume={2}&volumeCurrency={3}&otherCurrency={4}'.format(
      pair, placementPrice, volume, volumeCurrency, otherCurrency)
    request(method='POST', uri='/api/v1/market/orders?submitId={0}&{1}'.format(uuid.uuid4(), placement))
  
  for order in ordersAtNotBestPrice:
    print('cancelling order {0}'.format(order['price']))
    request(method='POST', uri='/api/v1/market/orders/close/{0}'.format(order['orderId']))


def getBestSellPrice(pair, isSellingPrimary):
  bestOffers = requests.get('https://api.walutomat.pl/api/v1/public/market/orderbook/{0}'.format(pair)).json()
  bestSellPrice = float(bestOffers['asks'][0]['price'])
  bestBuyPrice = float(bestOffers['bids'][0]['price'])
  return bestSellPrice if isSellingPrimary else bestBuyPrice


def getForexRate(pair):
  r = requests.get('https://user.walutomat.pl/api/public/marketBrief/{0}'.format(pair))
  return float(r.json()['bestOffers']['forex_now'])


def request(uri, method='GET'):
  ts = str(int(time.time() * 1000))
  sign = hmac.new(secret, msg=uri+ts, digestmod=hashlib.sha256).hexdigest()
  headers = {
    'X-API-KEY': apikey,
    'X-API-NONCE': ts,
    'X-API-SIGNATURE': sign
  }
  r = requests.request(method=method, url='https://api.walutomat.pl' + uri, headers=headers)
  return r.json()


main()
