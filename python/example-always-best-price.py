#!/usr/bin/env python
#
# This example program uses walutomat API to watch a currency pair on Walutomat market and keep placing best offer. 
# It uses price limit to avoid placing offers too close to Forex rate. It also automatically cancels all not best offers.
#
# Program runs on CHF_PLN pair, always tries to sell 0.10 CHF at price 0.0001 better than others, but not closer than 0.0040 from FX.
#
# Keep in mind that this is just an example program, you are using it at your own risk.
#
# Usage:
# APIKEY=myapikey SECRET=myapisecret python example-always-best-price.py
#

import requests
import time
import hmac
import hashlib
import uuid
import os

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
  existingOrders = filter(lambda order: order.get('market') == pair and order.get('buySell') == 'SELL' and order.get('volumeCurrency') == volumeCurrency, orders)
  ordersAtNotBestPrice = filter(lambda order: bestPrice + delta * float(order.get('price')) < 0, existingOrders)
  ordersAtBestPrice = filter(lambda order: bestPrice + delta * float(order.get('price')) == 0, existingOrders)
  
  print pair+' SELL '+volumeCurrency+' forex: '+str(forexRate)+', current best: '+str(bestPrice)+' has '+str(len(ordersAtBestPrice))+' best offers, cancelling '+str(len(ordersAtNotBestPrice))+' offers'

  if not ordersAtBestPrice:
    placementPrice = float(bestPrice) + delta * pricePips
    if abs(forexRate - placementPrice) < priceLimitPips:
      print 'not placing, closer than '+str(priceLimitPips)+' to forex'
    print 'placing order '+str(placementPrice)
    placement = 'pair='+pair+'&price='+str(placementPrice)+'&buySell=SELL&volume='+volume+'&volumeCurrency='+volumeCurrency+'&otherCurrency='+otherCurrency
    request(method='POST', uri='/api/v1/market/orders?submitId='+str(uuid.uuid4())+'&'+placement)
  
  for order in ordersAtNotBestPrice:
    print 'cancelling order '+order.get('price')
    request(method='POST', uri='/api/v1/market/orders/close/'+order.get('orderId'))

def getBestSellPrice(pair, isSellingPrimary):
  bestOffers = requests.get('https://api.walutomat.pl/api/v1/public/market/orderbook/'+pair).json()
  bestSellPrice = float(bestOffers.get('asks')[0].get('price'))
  bestBuyPrice = float(bestOffers.get('bids')[0].get('price'))
  return bestSellPrice if isSellingPrimary else bestBuyPrice

def getForexRate(pair):
  r = requests.get('https://user.walutomat.pl/api/public/marketBrief/'+pair)
  return float(r.json().get("bestOffers").get("forex_now"));

def request(uri, method='GET'):
  ts = str(int(time.time()*1000))
  sign = hmac.new(secret, msg=uri+ts, digestmod=hashlib.sha256).hexdigest()
  headers = {
    'X-API-KEY': apikey,
    'X-API-NONCE': ts,
    'X-API-SIGNATURE': sign
  }
  r = requests.request(method=method, url='https://api.walutomat.pl'+uri, headers=headers)
  return r.json()

main()
