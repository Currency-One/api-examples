#!/usr/bin/node

const crypto = require('crypto');
const request = require('request');
const uuid = require('uuid');

// Credentials
const apikey = null
const secret = null

// Get current offers
request('https://api.walutomat.pl/api/v1/public/market/orderbook/EUR_PLN', function(error, response, body) {
  console.log("\n\nCurrent best offers:", body);
});

if ((!apikey) || (!secret)) {
  throw new Error("apikey and/or secret is required")
}

// Check my balance
var uri = '/api/v1/account/balances';
var ts = '' + (new Date()).getTime();
var sign = crypto.createHmac('sha256', secret).update(uri + ts).digest('hex');
var options = {
  method: 'GET',
  url: 'https://api.walutomat.pl' + uri,
  headers: {
    'X-API-KEY': apikey,
    'X-API-NONCE': ts,
    'X-API-SIGNATURE': sign
  }
}
request(options, function(error, response, body) {
  console.log("\n\nMy balance:", body);
});

// Place order
var uri = '/api/v1/market/orders?submitId=' + uuid.v4() + '&pair=EUR_PLN&price=4.231&buySell=BUY&volume=1.00&volumeCurrency=EUR&otherCurrency=PLN';
var ts = '' + (new Date()).getTime();
var sign = crypto.createHmac('sha256', secret).update(uri + ts).digest('hex');
var options = {
  method: 'POST',
  url: 'https://api.walutomat.pl' + uri,
  headers: {
    'X-API-KEY': apikey,
    'X-API-NONCE': ts,
    'X-API-SIGNATURE': sign
  }
}
request(options, function(error, response, body) {
  console.log("\n\nPlacing an order:", body);
});

// Withdrawing an order
var uri = '/api/v1/market/orders/close/5137bdb7-acde-41ff-aeb2-0908af0bd3d9';
var ts = '' + (new Date()).getTime();
var sign = crypto.createHmac('sha256', secret).update(uri + ts).digest('hex');
var options = {
  method: 'POST',
  url: 'https://api.walutomat.pl' + uri,
  headers: {
    'X-API-KEY': apikey,
    'X-API-NONCE': ts,
    'X-API-SIGNATURE': sign
  }
}
request(options, function(error, response, body) {
  console.log("\n\nWithdraw an order:", body);
});