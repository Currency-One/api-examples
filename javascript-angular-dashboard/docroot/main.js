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

function sendRequestWithouhtSign(requestOptions) {

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
      sendRequestWithouhtSign({
        endpoint: '/api/public/marketBrief/',
        method: 'get',
        body: '',
        onSuccess: function(response) {
          $scope.exchangeRates__response = response.data;
          $scope.$applyAsync();
        },
        onError: function(error) {
          console.log(error);
        }
      });
    };

    $scope.exchangeRates__response = {};

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
        total: '–',
      }
    };


});
