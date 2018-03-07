var APIURL = 'https://api.walutomat.pl';
var APIURL_WITHOUT_SIGN = 'https://user.walutomat.pl';

/*======================================================
=            Functions for getting api data            =
======================================================*/
function signRequest(requestOptions) { //endpoint, method, body, apikey, secret
  var timestamp = '' + (new Date()).getTime();
  var shaObj = new jsSHA('SHA-256', 'TEXT');
  shaObj.setHMACKey(requestOptions.secret, 'TEXT');
  shaObj.update(requestOptions.endpoint + timestamp);
  var sign = shaObj.getHMAC('HEX');

  var updatedRequest = JSON.stringify({
    method: requestOptions.method.toLowerCase(),
    url: APIURL + requestOptions.endpoint,
    body: requestOptions.body || '',
    headers: {
      'X-API-KEY': requestOptions.apikey,
      'X-API-NONCE': timestamp,
      'X-API-SIGNATURE': sign
    }
  }, null, 4);

  return updatedRequest;
}

function sendRequest(requestOptions) {

  /*
  EXAMPLE
  sendRequest({
    endpoint: '/api/v1/account/balances',
    method: 'get',
    body: '',
    apikey: 'xxxxxxxxx',
    secret: 'xxxxxxxxx',
    onSuccess: function(resonse) {},
    onError: function(error) {},
  })
  */

  var updatedRequest = signRequest(requestOptions);
  console.log(updatedRequest);
  axios.post('/api', JSON.parse(updatedRequest))
    .then(function(response) {
      if (typeof requestOptions.onSuccess === 'function') {
        requestOptions.onSuccess(response);
      }
    })
    .catch(function(error) {
      if (typeof requestOptions.onError === 'function') {
        requestOptions.onError(error.message);
      }
    });
}

function sendRequestWithoutSign(requestOptions) {

  //Needed for other public endpoints like exchange rates

  /*
  EXAMPLE
  sendRequest({
    endpoint: '/api/v1/account/balances',
    method: 'get',
    body: '',
    onSuccess: function(resonse) {},
    onError: function(error) {},
  })
  */

  var request = JSON.stringify({
    method: requestOptions.method.toLowerCase(),
    url: APIURL_WITHOUT_SIGN + requestOptions.endpoint,
    body: requestOptions.body || '',
  }, null, 4);

  axios.post('/api', JSON.parse(request))
    .then(function(response) {
      if (typeof requestOptions.onSuccess === 'function') {
        requestOptions.onSuccess(response);
      }
    })
    .catch(function(error) {
      if (typeof requestOptions.onError === 'function') {
        requestOptions.onError(error.message);
      }
    });
}

/*=====  End of Functions for getting api data  ======*/



/* Angular 1.6.6 */
var proDashboard = angular.module('proDashboard', []);
proDashboard.controller('proDashboardController', function($scope) {

    /*----------  Saving api keys to local storage  ----------*/
    $scope.apiKey = localStorage.getItem('proDashboard__apikey') || '';
    $scope.$watch("apiKey", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__apikey', newVal);
      }
    });

    $scope.secret = localStorage.getItem('proDashboard__secret') || '';
    $scope.$watch("secret", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__secret', newVal);
      }
    });

    /*----------  Exchange rates table  ----------*/
    $scope.exchangeRates__get = function() {
      sendRequestWithoutSign({
        endpoint: '/api/public/marketBrief/',
        method: 'get',
        body: '',
        onSuccess: function(response) {
          $scope.exchangeRates__response = response.data;

          $scope.exchangeRates = $.extend($scope.exchangeRates, R.indexBy(R.prop('pair'), response.data));
          console.log($scope.exchangeRates);
          console.log($scope.exchangeRates.EUR_PLN.bestOffers.forex_now);

          $scope.$applyAsync();
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $scope.exchangeRates__response = {};
    $scope.exchangeRates = {};

    /*----------  Wallet state  ----------*/
    $scope.walletState__get = function() {
      sendRequest({
        endpoint: '/api/v1/account/balances',
        method: 'get',
        body: '',
        apikey: $scope.apiKey,
        secret: $scope.secret,
        onSuccess: function(response) {
          $scope.walletState__response = response.data;
          $scope.walletState = $.extend($scope.walletState, R.indexBy(R.prop('currency'), response.data));
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $scope.walletState__response = {};

    $scope.walletState = {
      PLN: {
        balanceReserved: '–',
        balanceAll: '–',
        balanceAvailable: '–',
      },
      EUR: {
        balanceReserved: '–',
        balanceAll: '–',
        balanceAvailable: '–',
      },
      USD: {
        balanceReserved: '–',
        balanceAll: '–',
        balanceAvailable: '–',
      },
      GBP: {
        balanceReserved: '–',
        balanceAll: '–',
        balanceAvailable: '–',
      },
      CHF: {
        balanceReserved: '–',
        balanceAll: '–',
        balanceAvailable: '–',
      }
    };

    /*----------  Navigation among currency pairs  ----------*/
    $scope.navigation__selectedPair = 'EUR_PLN';

    /*----------  Orderbook  ----------*/
    $scope.orderbook__allPairs = {};

    $scope.orderbook__getPair = function(pair) {
      sendRequest({
        endpoint: '/api/v1/public/market/orderbook/'+pair,
        method: 'get',
        body: '',
        apikey: $scope.apiKey,
        secret: $scope.secret,
        onSuccess: function(response) {
          $scope.orderbook__response = response.data;
          $scope.orderbook__allPairs[pair] = response.data;
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $scope.orderbook__getAllPairs = function() {
      var supportedCurrencyPairs = [
        'EUR_GBP',
        'EUR_USD',
        'EUR_CHF',
        'EUR_PLN',
        'GBP_USD',
        'GBP_CHF',
        'GBP_PLN',
        'USD_CHF',
        'USD_PLN',
        'CHF_PLN',
      ];

      $.each(supportedCurrencyPairs, function(index, value) {
        $scope.orderbook__getPair(value);
      });
    };

    /*----------  My orders  ----------*/
    $scope.myOrders__get = function() {
      sendRequest({
        endpoint: '/api/v1/market/orders',
        method: 'get',
        body: '',
        apikey: $scope.apiKey,
        secret: $scope.secret,
        onSuccess: function(response) {
          $scope.myOrders__response = response.data;
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $scope.myOrders__response = {};

    $scope.myOrders = [];

    /*----------  My orders  ----------*/
    $scope.myOrders__get = function() {
      sendRequest({
        endpoint: '/api/v1/market/orders',
        method: 'get',
        body: '',
        apikey: $scope.apiKey,
        secret: $scope.secret,
        onSuccess: function(response) {
          $scope.myOrders__response = response.data;
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $scope.myOrders__response = {};

    $scope.myOrders = [];

});
