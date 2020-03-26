#!/usr/bin/env python
#
# This example program uses walutomat API to watch a currency pair on Walutomat market and keep placing best offer. 
# Used rules:
# - order price should be no further than <priceLimitPips> pips from forex
# - order price should be <pricePips> pips better than other's best
# - order price shold not be better than other's offers below <counterOffersIgnorableVolume>, 
#   until their sum is not bigger than <counterOffersIgnorableTotalVolume>
# - order volume should be <volume> PLN but in <volumeCurrency>
# - order volume should be 2x if price is more than <doubleVolumeLimit> from forex
# - partially executed order should be replaced with new one

# Program steps:
# Program runs a loop every 5 secs with following steps:
# 1. Gets current FX rate, best offers, my open offers from Walutomat
# 2. Calculates best offer price and volume
# 3. Replaces previous order with the new one at best offer/volume if it changed
#
# Keep in mind that this is just an example program, you are using it at your own risk.
#
# Usage:
# APIKEY=myapikey SECRET=myapisecret python example-seller.py
#

from decimal import Decimal
import hashlib
import hmac
import os
import requests
import time
import uuid
import datetime
import json


# Program parameters
pair = 'CHF_PLN'
volumeCurrency = 'CHF'
otherCurrency = 'PLN'
defaults = {
  'priceLimitPips': '50',
  'doubleVolumeLimitPips': '100',
  'pricePips': '1',
  'volumePLN': '100',
  'counterOffersIgnorableVolume': '10',
  'counterOffersIgnorableTotalVolume': '60'
}

# Credentials
apikey = os.environ['APIKEY']
secret = os.environ['SECRET']

if not apikey or not secret:
  raise ValueError('APIKEY and/or SECRET is missing')

FOURPLACES = Decimal('0.0001')
TWOPLACES= Decimal('0.01')

def main():
  try:
    options = json.load(open('example-seller.json', 'r'))
  except:
    options = defaults
  options['priceLimitPips'] = input_default('limit to forex (in pips, default {0}): ', options['priceLimitPips'])
  options['doubleVolumeLimitPips'] = input_default('double price limit (in pips, default {0}): ', options['doubleVolumeLimitPips'])
  json.dump(options, open('example-seller.json', 'w'))
  print(options)

  while True:
    try:
      loop_step(options)
    except RuntimeError as ex:
      print(ex)
    time.sleep(5)


def loop_step(options):
  forexRate = fetch_forex_rate(pair)
  myOrders = fetch_my_orders(pair, volumeCurrency)
  allOrders = fetch_orderbook(pair, volumeCurrency == pair[:3])
  availBalance = fetch_balance(volumeCurrency)
  delta = Decimal(-1 if volumeCurrency == pair[:3] else 1) # figure out if we're minimizing or maximizing the price
 
  newPrice = calculate_price(forexRate, myOrders, allOrders, delta, options)
  newOrderVolume = calculate_volume(forexRate, newPrice, availBalance, delta, options)

  notAtPrice = orders_not_at_price(myOrders, newPrice)
  notAtVolume = orders_not_at_volume(myOrders, newOrderVolume)
  toCancel = notAtPrice + notAtVolume
  toKeep = difference(myOrders, toCancel)
  
  now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  if toCancel:
    toCancelStr = 'to cancel: {0} (not at price), {1} (not at volume)'.format(len(notAtPrice), len(notAtVolume))
  else:
    toCancelStr = ''
  newOrderStr = '' if toKeep else 'no active order'
  print('{0} {1} forex: {2}, Sell {3} {4} at {5} (dist {6}) {7} {8}'
    .format(now, pair, forexRate, newOrderVolume, volumeCurrency, newPrice, delta * (forexRate - newPrice), toCancelStr, newOrderStr))

  cancel_all(toCancel)
  
  if not toKeep:
    place_order(pair, newPrice, newOrderVolume, volumeCurrency, otherCurrency)


def calculate_price(forexRate, myOrders, allOrders, delta, options):
  counterOffersIgnorableVolume = Decimal(options['counterOffersIgnorableVolume'])
  counterOffersIgnorableTotalVolume = Decimal(options['counterOffersIgnorableTotalVolume'])
  pricePips = Decimal(options['pricePips']) / 10000
  priceLimitPips = Decimal(options['priceLimitPips']) / 10000
  othersOrders = [subtract_my_orders_at_price(myOrders, price) for price in allOrders]
  
  newPrice = None
  
  sumVolume = Decimal('0')
  for order in othersOrders:
    if Decimal(order['baseVolume']) <= counterOffersIgnorableVolume:
      sumVolume = sumVolume + Decimal(order['baseVolume'])

      if sumVolume > counterOffersIgnorableTotalVolume:
        newPrice = Decimal(order['price']) + delta * pricePips
        break
    else:
      newPrice = Decimal(order['price']) + delta * pricePips
      break

  if newPrice == None:
    print('All current offers are either smaller than {0} or their sum is less than {1}'
      .format(counterOffersIgnorableVolume, counterOffersIgnorableTotalVolume))
    return None

  distToForex = delta * (forexRate - newPrice)
  if distToForex < priceLimitPips:
    newPrice = forexRate - delta * priceLimitPips
  return newPrice.quantize(FOURPLACES)


def calculate_volume(forexRate, newPrice, availBalance, delta, options):
  currencyVolume = Decimal(options['volumePLN']) / forexRate
  distToForex = delta * (forexRate - newPrice)
  if distToForex >= Decimal(options['doubleVolumeLimitPips']) / 10000:
    currencyVolume = currencyVolume * 2

  return min([currencyVolume, Decimal(availBalance['balanceAll'])]).quantize(TWOPLACES)


def difference(list1, list2):
  return [e for e in list1 if e not in list2]


def orders_not_at_price(orders, price): 
  return filter(lambda order: Decimal(order['price']) != price, orders)


def orders_at_price(orders, price): 
  return filter(lambda order: Decimal(order['price']) == price, orders)


def subtract_my_orders_at_price(myOrders, price):
  atPrice =  orders_at_price(myOrders, Decimal(price['price']))
  sellingAtPrice = map(lambda order: Decimal(order['volume']) - Decimal(order['soldAmount'].split(' ')[0]), atPrice)
  totalMineAtPrice = sum(sellingAtPrice)
  return {
    'price': price['price'],
    'baseVolume': (Decimal(price['baseVolume']) - totalMineAtPrice).quantize(TWOPLACES)
  }


def orders_not_at_volume(orders, volume):
  return filter(lambda order: Decimal(order['volume']) != volume or order['completion'] > 0, orders)


def input_default(prompt, default):
  try:
    return input(prompt.format(default))
  except:
    return default


def place_order(pair, newPrice, newOrderVolume, volumeCurrency, otherCurrency):
  if newPrice is None or newOrderVolume <= 0:
    return
  placement = 'pair={0}&price={1}&buySell=SELL&volume={2}&volumeCurrency={3}&otherCurrency={4}'.format(
    pair, newPrice, newOrderVolume, volumeCurrency, otherCurrency)
  request(method='POST', uri='/api/v1/market/orders?submitId={0}&{1}'.format(uuid.uuid4(), placement))


def cancel_all(orders):
  for order in orders:
    request(method='POST', uri='/api/v1/market/orders/close/{0}'.format(order['orderId']))


def fetch_balance(currency):
  balances = request('/api/v1/account/balances')
  currencyBalances = [balance for balance in balances if balance['currency'] == currency]
  if len(currencyBalances) == 0:
    return None
  return currencyBalances[0]
  


def fetch_my_orders(pair, volumeCurrency):
  orders = request('/api/v1/market/orders/')
  return filter(lambda order: 
    order['market'] == pair 
    and order['buySell'] == 'SELL' 
    and order['volumeCurrency'] == volumeCurrency, orders)


def fetch_orderbook(pair, isSellingPrimary):
  bestOffers = requests.get('https://api.walutomat.pl/api/v1/public/market/orderbook/{0}'.format(pair)).json()
  side = 'asks' if isSellingPrimary else 'bids'
  return bestOffers[side]


def fetch_forex_rate(pair):
  r = requests.get('https://user.walutomat.pl/api/public/marketBrief/{0}'.format(pair))
  return Decimal(r.json()['bestOffers']['forex_now']).quantize(FOURPLACES)


def request(uri, method='GET'):
  ts = str(int(time.time() * 1000))
  sign = hmac.new(secret, msg=uri+ts, digestmod=hashlib.sha256).hexdigest()
  headers = {
    'X-API-KEY': apikey,
    'X-API-NONCE': ts,
    'X-API-SIGNATURE': sign
  }
  r = requests.request(method=method, url='https://api.walutomat.pl' + uri, headers=headers)
  if r.status_code >= 300:
    raise RuntimeError(r.text)
  return r.json()


main()
