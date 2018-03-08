var APIURL = 'https://api.walutomat.pl';
var APIURL_WITHOUT_SIGN = 'https://user.walutomat.pl';

var SUPPORTED_CURRENCY_PAIRS = [
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
    $scope.exchangeRates__response = {};
    $scope.exchangeRates = {};

    $scope.exchangeRates__get = function() {
      sendRequestWithoutSign({
        endpoint: '/api/public/marketBrief/',
        method: 'get',
        body: '',
        onSuccess: function(response) {
          $scope.exchangeRates__response = response.data;

          $scope.exchangeRates = $.extend($scope.exchangeRates, R.indexBy(R.prop('pair'), response.data));
          $.each($scope.exchangeRates, function(key, value) {
            var thisKey = $scope.exchangeRates[key];
            thisKey.bestOffers.spread_now = thisKey.bestOffers.ask_now - thisKey.bestOffers.bid_now;
          });

          $scope.$applyAsync();
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $.each(SUPPORTED_CURRENCY_PAIRS, function(index, value) {
      $scope.exchangeRates[value] = {
        pair: value,
        bestOffers: {
          forex_now: '–,––––',
          bid_now: '–,––––',
          ask_now: '–,––––',
          spread_now: '–––',
        },
        lastExchanges: [],
        dayExchanges: []
      };
    });

    $scope.exchangeRates__formattedNumber = function(valueToFormat) {
      if (typeof valueToFormat === 'number') {
        return valueToFormat.toFixed(4).replace('.', ',');
      } else {
        return valueToFormat;
      }
    };

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
    $scope.navigation__chooseSelectedPair = function(pairToSelect) {
      $scope.navigation__selectedPair = pairToSelect;
    };

    $scope.navigation__authorisationModalIsShown = false;
    $scope.navigation__showAuthorisationModal = function() {
      $scope.navigation__authorisationModalIsShown = true;
    };
    $scope.navigation__hideAuthorisationModal = function() {
      $scope.navigation__authorisationModalIsShown = false;
    };


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
      $.each(SUPPORTED_CURRENCY_PAIRS, function(index, value) {
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
          $scope.myOrders = $.extend($scope.myOrders, response.data);
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

    $scope.orderbook__highlightOrdersToBuy = function(event) {
      var thisRow = $(event.currentTarget).closest('.pro-table-row');
      var previousRows = thisRow.prevAll();
      thisRow.addClass('is-highlighted');
      previousRows.addClass('is-highlighted');
    };

    $scope.orderbook__removeHighlightFromOrdersToBuy = function(event) {
      var thisRow = $(event.currentTarget).closest('.pro-table-row');
      var previousRows = thisRow.prevAll();
      thisRow.removeClass('is-highlighted');
      previousRows.removeClass('is-highlighted');
    };

    $scope.orderbook__cancelPurchase = function(event) {
      var thisRow = $(event.currentTarget).closest('.pro-table-row');
      //also hide the confirmation buttons
      thisRow.find('.pro-table-action__confirm-buttons').addClass('is-hidden');
      thisRow.find('.pro-table-action__button').removeClass('is-hidden');
    };

    $scope.orderbook__showConfirmationButtons = function(event) {
      $(event.currentTarget).addClass('is-hidden');
      var thisRow = $(event.currentTarget).closest('.pro-table-row');
      thisRow.find('.pro-table-action__confirm-buttons').removeClass('is-hidden');
    };

    $scope.orderbook__confirmPurchase = function(purchasePrice, purchaseVolume) {
      console.log(purchasePrice);
      //TODO: calculate purchase volume so that it will buy all the highlighted orders
      //Should it refresh the state before purchase to prevent errors?
      //Should it calculate this on server?
    };


    /*----------  Init  ----------*/
    function proTable__getAllData() {
      $scope.walletState__get();
      $scope.exchangeRates__get();
      $scope.orderbook__getAllPairs();
      $scope.myOrders__get();
    }

    proTable__getAllData();
    setInterval(function() {
      proTable__getAllData();
    }, 10000);

    //TODO
    //Ostatnie wymiany jeśli API public dostępne
    //Dodawanie zleceń z formularza
    //Usuwanie swoich zleceń
    //Pokazywanie własnych zleceń na liście wszystkich zleceń

});
