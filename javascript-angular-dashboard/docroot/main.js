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
    },
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
        requestOptions.onError(error);
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
    $scope.apiCredentials = {};

    if (typeof localStorage.getItem('proDashboard__apikey') === 'string' || typeof localStorage.getItem('proDashboard__secret') === 'number') {
      $scope.apiCredentials.apiKey = localStorage.getItem('proDashboard__apikey');
    } else {
      $scope.apiCredentials.apiKey = '';
    }

    $scope.$watch("apiCredentials.apiKey", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__apikey', newVal);
      }
    });

    if (typeof localStorage.getItem('proDashboard__secret') === 'string' || typeof localStorage.getItem('proDashboard__secret') === 'number') {
      $scope.apiCredentials.secret = localStorage.getItem('proDashboard__secret');
    } else {
      $scope.apiCredentials.secret = '';
    }

    $scope.$watch("apiCredentials.secret", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__secret', newVal);
      }
    });

    /*----------  General helpers  ----------*/
    $scope.formattedNumber = function(valueToFormat, decimalPlaces) {
      if (typeof decimalPlaces !== 'number') {
        decimalPlaces = 2;
      }

      if (typeof valueToFormat == 'number') {
        return valueToFormat.toFixed(decimalPlaces).replace('.', ',');
      } else {
        return valueToFormat.replace('.', ',');
      }
    };

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

            var findMinAndMaxFromLastExchanges = function() {
              var lastExchangesMin = 100000; //TODO don't hardcode number here
              var lastExchangesMax = 0;

              $.each(thisKey.lastExchanges, function(index, value) {
                if (value.price < lastExchangesMin) {
                  lastExchangesMin = value.price; //TODO refactor
                }
              });
              thisKey.lastExchanges.min = lastExchangesMin;

              $.each(thisKey.lastExchanges, function(index, value) {
                if (value.price > lastExchangesMax) {
                  lastExchangesMax = value.price; //TODO refactor
                }
              });
              thisKey.lastExchanges.max = lastExchangesMax;
            };
            findMinAndMaxFromLastExchanges();

          }); //-- end each

          $scope.$applyAsync();
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z pobraniem danych.');
          console.log(error);
        }
      });
    };

    $scope.exchangeRates__calculateBarChartWidth = function(priceToCompare) {
      var lastExchangesWithMinAndMax = $scope.exchangeRates[$scope.navigation__selectedPair].lastExchanges;
      var calculatedBarChartWidth = ( (priceToCompare - lastExchangesWithMinAndMax.min)/(lastExchangesWithMinAndMax.max - lastExchangesWithMinAndMax.min) )*100;
      if (calculatedBarChartWidth < 1) {
        calculatedBarChartWidth = 1;
      }
      return calculatedBarChartWidth;
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

    /*----------  Wallet state  ----------*/
    $scope.walletState__get = function() {
      sendRequest({
        endpoint: '/api/v1/account/balances',
        method: 'get',
        body: '',
        apikey: $scope.apiCredentials.apiKey,
        secret: $scope.apiCredentials.secret,
        onSuccess: function(response) {
          $scope.walletState__response = response.data;
          $scope.walletState = $.extend($scope.walletState, R.indexBy(R.prop('currency'), response.data));
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z pobraniem danych.');
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
        apikey: $scope.apiCredentials.apiKey,
        secret: $scope.apiCredentials.secret,
        onSuccess: function(response) {
          $scope.orderbook__response = response.data;
          $scope.orderbook__allPairs[pair] = response.data;
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z pobraniem danych.');
          console.log(error);
        }
      });
    };

    $scope.orderbook__getAllPairs = function() {
      $.each(SUPPORTED_CURRENCY_PAIRS, function(index, value) {
        $scope.orderbook__getPair(value);
      });
    };

    /*----------  Orders buying  ----------*/
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
      //TODO: preloader after confirming and waiting for response, prevent double submit
      //Should it refresh the state before purchase to prevent errors?
      //Should it calculate this on server?
    };

    /*----------  Adding new orders  ----------*/
    $scope.addNewOrder = {
      inBids: {
        price: "" || localStorage.getItem("proDashboard__addNewOrder__inBids__price"),
        volume: "" || localStorage.getItem("proDashboard__addNewOrder__inBids__volume"),
      },
      inAsks: {
        price: "" || localStorage.getItem("proDashboard__addNewOrder__inAsks__price"),
        volume: "" || localStorage.getItem("proDashboard__addNewOrder__inAsks__volume"),
      }
    };

    //TODO shorten and refactor storing in localstorage
    $scope.$watch("addNewOrder.inBids.price", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inBids__price', newVal);
      }
    });

    $scope.$watch("addNewOrder.inAsks.price", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inAsks__price', newVal);
      }
    });

    $scope.$watch("addNewOrder.inBids.volume", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inBids__volume', newVal);
      }
    });

    $scope.$watch("addNewOrder.inAsks.volume", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inAsks__volume', newVal);
      }
    });

    $scope.addNewOrder__post = function(requestOptions) {
      var requestParams = {
        pair: requestOptions.pair,
        submitId: uuid.v4(),
        buySell: requestOptions.buySell,
        price: Number(requestOptions.price.replace(',', '.')),
        volume: Number(requestOptions.volume.replace(',', '.')),
        volumeCurrency: requestOptions.volumeCurrency,
        otherCurrency: requestOptions.otherCurrency,
      };

      console.log($.param(requestParams));

      sendRequest({
        endpoint: '/api/v1/market/orders/'+'?'+$.param(requestParams),
        method: 'post',
        apikey: $scope.apiCredentials.apiKey,
        secret: $scope.apiCredentials.secret,
        onSuccess: function(response) {
          $scope.addNewOrder__response = response.data;
          console.log(response.data);

          if (response.data.orderId) {
            FlashingNotifications.showAndHideNotification('success', 'Dodałeś zlecenie.');
          }

          if (response.data && response.data.data && response.data.data.errors) {
            FlashingNotifications.showAndHideNotification('error', 'Problem z dodaniem zlecenia. ' + JSON.stringify(response.data.data.errors));
          }

          $scope.refreshData(); //after adding new order refresh state of my orders
          //no need to $scope.$applyAsync(); because it is triggered in refreshData()

          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z wystawieniem zlecenia.');
          console.log(error);
        }
      });
    };

    $scope.addNewOrder__showConfirmationButtons = function(event) {
      $(event.currentTarget).closest('.pro-offer-form__button-cell').addClass('is-hidden');
      var thisRow = $(event.currentTarget).closest('.pro-add-offer-row__form'); //TODO separate css classes from login using attributes
      thisRow.find('.pro-add-offer-row__confirm-buttons').removeClass('is-hidden');
    };

    $scope.addNewOrder__hideConfirmationButtons = function(event) {
      var thisRow = $(event.currentTarget).closest('.pro-add-offer-row__form');
      thisRow.find('.pro-add-offer-row__confirm-buttons').addClass('is-hidden');
      thisRow.find('.pro-offer-form__button-cell').removeClass('is-hidden');
    };

    $scope.addNewOrder__confirmNewOrder = function(inBidsOrInAsks) {
      if (inBidsOrInAsks === 'inBids') {
        $scope.addNewOrder__post({
          pair: $scope.navigation__selectedPair,
          price: $scope.addNewOrder.inBids.price,
          volume: $scope.addNewOrder.inBids.volume,
          buySell: 'BUY',
          volumeCurrency: $scope.navigation__selectedPair.split('_')[0],
          otherCurrency: $scope.navigation__selectedPair.split('_')[1],
        });
      }
    };

    $scope.addNewOrder__updatePriceInputInBids = function(newPrice) {
      $scope.addNewOrder.inBids.price = (Number(newPrice)+(0.0001)).toFixed(4); //TODO - this will not support currencies with different decimal ratio, like HUF
    };

    $scope.addNewOrder__updatePriceInputInAsks = function(newPrice) {
      $scope.addNewOrder.inAsks.price = (Number(newPrice)+(0.0001)).toFixed(4);
    };

    /*----------  My orders  ----------*/
    $scope.myOrders__get = function() {
      sendRequest({
        endpoint: '/api/v1/market/orders',
        method: 'get',
        body: '',
        apikey: $scope.apiCredentials.apiKey,
        secret: $scope.apiCredentials.secret,
        onSuccess: function(response) {
          $scope.myOrders__response = response.data;
          $scope.myOrders = $.extend($scope.myOrders, response.data);
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z pobraniem danych.');
          console.log(error);
        }
      });
    };

    $scope.myOrders__response = {};

    $scope.myOrders = [];

    /*----------  Moment.js formatting times  ----------*/
    $scope.formattedTime = function(timeToFormat) {
      return moment(timeToFormat).fromNow();
    };

    /*----------  Refreshing data  ----------*/
    $scope.refreshData = function() {
      proTable__getAllData();
    };

    /*----------  Init  ----------*/
    function proTable__getPublicData() {
      $scope.exchangeRates__get();
      $scope.orderbook__getAllPairs();
    }

    function proTable__getPrivateData() {
      if ($scope.apiCredentials.apiKey !== '') {
        $scope.walletState__get();
        $scope.myOrders__get();
      }
    }

    function proTable__getAllData() {
      proTable__getPublicData();
      proTable__getPrivateData();
    }

    proTable__getAllData();
    setInterval(function() {
      proTable__getAllData();
    }, 10500);

    //Show config modal if no apikey provided
    if ($scope.apiCredentials.apiKey === '') {
      $scope.navigation__showAuthorisationModal();
    }

    $('.initial-load-overlay').addClass('is-hidden');

    //TODO
    //Dodawanie zleceń z formularza
    //Usuwanie swoich zleceń
    //Pokazywanie własnych zleceń na liście wszystkich zleceń
    //Success messages / error messages
    //Wstawianie kursu o jeden pips większego w formularz po kliknięciu niebieskiego kursu
    //Formatowanie czasu przez moment.js żeby pokazywać krótki 1d, 1h itd.
    //Liczenie kwoty skumulowanej w ofertach
    //Ostrzeżenie przy wpisywaniu zbyt odstającego od rynku kursu

});
