#!/usr/bin/env python3
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

from decimal import Decimal
import hashlib
import hmac
import os
import requests
import time
import uuid


# Program parameters
pair = 'CHF_PLN'
volume = '0.10'
volume_currency = 'CHF'
other_currency = 'PLN'
price_pips = Decimal('0.0001')
price_limit_pips = Decimal('0.0040')


# Credentials
api_key = os.environ['APIKEY']
secret = os.environ['SECRET']
assert api_key
assert secret


FOURPLACES = Decimal('0.0001')


def main():
    while True:
        loop_step()
        time.sleep(5)


def loop_step():
    forex_rate = get_forex_rate(pair)
    best_price = get_best_sell_price(pair, volume_currency == pair[:3])
    delta = Decimal(-1 if volume_currency == pair[:3] else 1)  # figure out if we're minimizing or maximizing the price
    orders = request('/api/v1/market/orders/')
    existing_orders = [
        o for o in orders
        if (
            o['market'] == pair and
            o['buySell'] == 'SELL' and
            o['volumeCurrency'] == volume_currency
        )
    ]
    orders_at_not_best_price = [o for o in existing_orders if best_price + delta * Decimal(o['price']) < 0]
    orders_at_best_price = [o for o in existing_orders if best_price + delta * Decimal(o['price']) == 0]
    print('{} SELL {}, forex: {}, current best: {}, orders at best price: {}, orders to cancel: {}'.format(
        pair, volume_currency, forex_rate, best_price, len(orders_at_best_price), len(orders_at_not_best_price)))

    if not orders_at_best_price:
        placement_price = best_price + delta * price_pips
        if abs(forex_rate - placement_price) < price_limit_pips:
            print('not placing, closer than {} to forex'.format(price_limit_pips))
        print('placing order {}'.format(placement_price))
        placement = 'pair={}&price={}&buySell=SELL&volume={}&volumeCurrency={}&otherCurrency={}'.format(
            pair, placement_price.quantize(FOURPLACES), volume, volume_currency, other_currency)
        requests.post(method='POST', uri='/api/v1/market/orders?submitId={}&{}'.format(uuid.uuid4(), placement))

    for order in orders_at_not_best_price:
        print('cancelling order {}'.format(order['price']))
        request(method='POST', uri='/api/v1/market/orders/close/{0}'.format(order['orderId']))


def get_best_sell_price(pair, is_selling_primary):
    best_offers = requests.get('https://api.walutomat.pl/api/v1/public/market/orderbook/{0}'.format(pair)).json()
    best_sell_price = Decimal(best_offers['asks'][0]['price'])
    best_buy_price = Decimal(best_offers['bids'][0]['price'])
    return best_sell_price if is_selling_primary else best_buy_price


def get_forex_rate(pair):
    r = requests.get('https://user.walutomat.pl/api/public/marketBrief/{0}'.format(pair))
    return Decimal(r.json()['bestOffers']['forex_now']).quantize(FOURPLACES)


def request(uri, method='GET'):
    ts = str(int(time.time() * 1000))
    sign = hmac.new(secret, msg=uri + ts, digestmod=hashlib.sha256).hexdigest()
    headers = {
        'X-API-KEY': api_key,
        'X-API-NONCE': ts,
        'X-API-SIGNATURE': sign
    }
    r = requests.request(method=method, url='https://api.walutomat.pl' + uri, headers=headers)
    if r.status_code >= 300:
        raise RuntimeError(r.text)
    return r.json()


if __name__ == '__main__':
    main()
