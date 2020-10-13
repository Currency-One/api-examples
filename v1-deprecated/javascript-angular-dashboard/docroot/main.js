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
        if (newVal === "" || typeof newVal === 'undefined') {
          localStorage.removeItem('proDashboard__secret');
        }
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
    $scope.exchangeRates = {};

    $scope.exchangeRates__get = function() {
      sendRequestWithoutSign({
        endpoint: '/api/public/marketBrief/',
        method: 'get',
        body: '',
        onSuccess: function(response) {

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
    $scope.navigation__selectedPair__base = 'EUR';
    $scope.navigation__selectedPair__other = 'PLN';

    $scope.navigation__chooseSelectedPair = function(pairToSelect) {
      $scope.navigation__selectedPair = pairToSelect;
      $scope.addNewOrder__updatePriceInputInBids($scope.orderbook__allPairs[pairToSelect].bids[0].price);
      $scope.addNewOrder__updatePriceInputInAsks($scope.orderbook__allPairs[pairToSelect].asks[0].price);
    };

    $scope.$watch("navigation__selectedPair", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.navigation__selectedPair__base = newVal.split('_')[0];
        $scope.navigation__selectedPair__other = newVal.split('_')[1];
      }
    });

    $scope.navigation__authorisationModalIsShown = false;
    $scope.navigation__showAuthorisationModal = function() {
      $scope.navigation__authorisationModalIsShown = true;
    };
    $scope.navigation__hideAuthorisationModal = function() {
      $scope.navigation__authorisationModalIsShown = false;
    };

    /*----------  Market price volumes  ----------*/
    //Currently unused in the UI because it's slower than the public API, returns too much data without pagination
    //Use it with ng-repeat="order in marketPriceVolumes['BID_'+navigation__selectedPair]"
    $scope.marketPriceVolumes = {};

    $scope.marketPriceVolumes__getAllPairs = function() {
      sendRequestWithoutSign({
        endpoint: '/api/public/marketPriceVolumes',
        method: 'get',
        body: '',
        onSuccess: function(response) {
          $scope.marketPriceVolumes = response.data;
          $scope.$applyAsync();
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z pobraniem danych.');
          console.log(error);
        }
      });
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
          $scope.orderbook__allPairs[pair] = response.data;

          var calculateAccumulatedVolumes = function(orderbookArray, volumeToAccumulate) {
            if ( $.isArray(orderbookArray) ) {
              var accumulatedVolumeCalculated = 0;
              $.each(orderbookArray, function(index, value) {
                accumulatedVolumeCalculated = Number(accumulatedVolumeCalculated) + Number(value[volumeToAccumulate]);
                orderbookArray[index][volumeToAccumulate+"__accumulated"] = accumulatedVolumeCalculated.toFixed(2);
              });
            }
          };

          calculateAccumulatedVolumes($scope.orderbook__allPairs[pair].asks, "baseVolume");
          calculateAccumulatedVolumes($scope.orderbook__allPairs[pair].bids, "baseVolume");
          calculateAccumulatedVolumes($scope.orderbook__allPairs[pair].asks, "marketVolume");
          calculateAccumulatedVolumes($scope.orderbook__allPairs[pair].bids, "marketVolume");

          var checkIfPriceIsTheSameInOneOfMyOwnOrders = function(orderbookArray) {
            if ( $.isArray(orderbookArray) ) {
              $.each(orderbookArray, function(index, value) {
                $.grep($scope.myOrders, function(arrayElement, elementIndex) {
                  if (arrayElement.price == value.price) {
                    value.includesMyOwnOrder = true;
                  }
                  return (arrayElement.price == value.price);
                });
              });
            }
          };

          checkIfPriceIsTheSameInOneOfMyOwnOrders($scope.orderbook__allPairs[pair].asks);
          checkIfPriceIsTheSameInOneOfMyOwnOrders($scope.orderbook__allPairs[pair].bids);

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
        setTimeout(function() {
          $scope.orderbook__getPair(value);
        }, index); //dirty hack so that each request is send separately with different timestamp
      });
    };

    /*----------  Orders buying  ----------*/
    $scope.orderbook__highlightOrdersToBuy = function(event) {
      var thisRow = $(event.currentTarget).closest('[js-selector="orderbook-row"]');
      var previousRows = thisRow.prevAll();
      thisRow.addClass('is-highlighted');
      previousRows.addClass('is-highlighted');
    };

    $scope.orderbook__removeHighlightFromOrdersToBuy = function(event) {
      var thisRow = $(event.currentTarget).closest('[js-selector="orderbook-row"]');
      var previousRows = thisRow.prevAll();
      thisRow.removeClass('is-highlighted');
      previousRows.removeClass('is-highlighted');
    };

    $scope.orderbook__cancelPurchase = function(event) {
      var thisRow = $(event.currentTarget).closest('[js-selector="orderbook-row"]');
      thisRow.find('[js-selector="orderbook-confirm-buttons"]').addClass('is-hidden');
      thisRow.find('[js-selector="orderbook-action-button"]').removeClass('is-hidden');
    };

    $scope.orderbook__showConfirmationButtons = function(event) {
      $(event.currentTarget).addClass('is-hidden');
      var thisRow = $(event.currentTarget).closest('[js-selector="orderbook-row"]');
      thisRow.find('[js-selector="orderbook-confirm-buttons"]').removeClass('is-hidden');
    };

    $scope.orderbook__confirmPurchase = function(inBidsOrInAsks, purchasePrice, purchaseVolume) {
      //TODO: preloader after confirming and waiting for response, prevent double submit
      //Should it refresh the state before purchase to prevent errors?
      //Should it calculate this on server?

      if (inBidsOrInAsks === 'inBids') {
        $scope.addNewOrder__post({
          pair: $scope.navigation__selectedPair,
          price: purchasePrice,
          volume: purchaseVolume,
          buySell: 'SELL',
          volumeCurrency: $scope.navigation__selectedPair__base,
          otherCurrency: $scope.navigation__selectedPair__other,
        });
      } else if (inBidsOrInAsks === 'inAsks') {
        $scope.addNewOrder__post({
          pair: $scope.navigation__selectedPair,
          price: purchasePrice,
          volume: purchaseVolume,
          buySell: 'SELL',
          volumeCurrency: $scope.navigation__selectedPair__other,
          otherCurrency: $scope.navigation__selectedPair__base,
        });
      }
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
        if (newVal === "" || typeof newVal === 'undefined') {
          localStorage.removeItem('proDashboard__addNewOrder__inBids__price');
        }
      }
    });

    $scope.$watch("addNewOrder.inAsks.price", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inAsks__price', newVal);
        if (newVal === "" || typeof newVal === 'undefined') {
          localStorage.removeItem('proDashboard__addNewOrder__inAsks__price');
        }
      }
    });

    $scope.$watch("addNewOrder.inBids.volume", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inBids__volume', newVal);
        if (newVal === "" || typeof newVal === 'undefined') {
          localStorage.removeItem('proDashboard__addNewOrder__inBids__volume');
        }
      }
    });

    $scope.$watch("addNewOrder.inAsks.volume", function(newVal, oldVal) {
      if (newVal !== oldVal) {
        localStorage.setItem('proDashboard__addNewOrder__inAsks__volume', newVal);
        if (newVal === "" || typeof newVal === 'undefined') {
          localStorage.removeItem('proDashboard__addNewOrder__inAsks__volume');
        }
      }
    });

    $scope.addNewOrder__post = function(requestOptions) {
      //basic frontend validation...
      if (!requestOptions.price || !requestOptions.volume) {
        FlashingNotifications.showAndHideNotification('error', 'Niepoprawny kurs lub kwota');
        return;
      }

      var requestParams = {
        pair: requestOptions.pair,
        submitId: uuid.v4(),
        buySell: requestOptions.buySell,
        price: Number(requestOptions.price.replace(',', '.')),
        volume: Number(requestOptions.volume.replace(',', '.')),
        volumeCurrency: requestOptions.volumeCurrency,
        otherCurrency: requestOptions.otherCurrency,
      };

      //TODO Preloader when submitting new order
      //FlashingNotifications.showAndHideNotification('neutral', 'Wysyłam zlecenie...');

      sendRequest({
        endpoint: '/api/v1/market/orders/'+'?'+$.param(requestParams),
        method: 'post',
        apikey: $scope.apiCredentials.apiKey,
        secret: $scope.apiCredentials.secret,
        onSuccess: function(response) {

          if (response.data.orderId) {
            FlashingNotifications.showAndHideNotification('success', 'Dodałeś zlecenie.');
          }

          if (response.data && response.data.data && response.data.data.errors) {
            FlashingNotifications.showAndHideNotification('error', 'Problem z dodaniem zlecenia. ' + JSON.stringify(response.data.data.errors));
          }

          if (response.data && response.data.data && response.data.data.problem) {
            FlashingNotifications.showAndHideNotification('error', 'Problem z dodaniem zlecenia. ' + JSON.stringify(response.data.data.problem));
          }

          setTimeout(function() {
            $scope.refreshData(); //after adding new order refresh state of my orders
            //no need to $scope.$applyAsync(); because it is triggered in refreshData()
          }, 500); //timeout needed to give server some time to refersh data

          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z wystawieniem zlecenia.');
          console.log(error);
        }
      });
    };

    $scope.addNewOrder__showConfirmationButtons = function(event) {
      var thisRow = $(event.currentTarget).closest('[js-selector="add-offer-form-row"]');
      $(event.currentTarget).closest('[js-selector="offer-button-cell"]').addClass('is-hidden');
      thisRow.find('[js-selector="add-offer-form-confirm-buttons"]').removeClass('is-hidden');
    };

    $scope.addNewOrder__hideConfirmationButtons = function(event) {
      var thisRow = $(event.currentTarget).closest('[js-selector="add-offer-form-row"]');
      thisRow.find('[js-selector="add-offer-form-confirm-buttons"]').addClass('is-hidden');
      thisRow.find('[js-selector="offer-button-cell"]').removeClass('is-hidden');
    };

    $scope.addNewOrder__confirmNewOrder = function(inBidsOrInAsks) {
      var checkPrice;
      if (inBidsOrInAsks === 'inBids') {
        checkPrice = $scope.checkIfOrderPriceIsNotTooFarFromMarket($scope.addNewOrder.inBids.price, $scope.navigation__selectedPair, 'inBids');
        if (checkPrice) {
          $scope.addNewOrder__post({
            pair: $scope.navigation__selectedPair,
            price: $scope.addNewOrder.inBids.price,
            volume: $scope.addNewOrder.inBids.volume,
            buySell: 'SELL',
            volumeCurrency: $scope.navigation__selectedPair__other,
            otherCurrency: $scope.navigation__selectedPair__base,
          });
        }
      } else if (inBidsOrInAsks === 'inAsks') {
        checkPrice = $scope.checkIfOrderPriceIsNotTooFarFromMarket($scope.addNewOrder.inAsks.price, $scope.navigation__selectedPair, 'inAsks');
        if (checkPrice) {
          $scope.addNewOrder__post({
            pair: $scope.navigation__selectedPair,
            price: $scope.addNewOrder.inAsks.price,
            volume: $scope.addNewOrder.inAsks.volume,
            buySell: 'SELL',
            volumeCurrency: $scope.navigation__selectedPair__base,
            otherCurrency: $scope.navigation__selectedPair__other,
          });
        }
      }
    };

    $scope.addNewOrder__updatePriceInputInBids = function(newPrice) {
      $scope.addNewOrder.inBids.price = (Number(newPrice)+(0.0001)).toFixed(4); //TODO - this will not support currencies with different decimal ratio, like HUF
    };

    $scope.addNewOrder__updatePriceInputInAsks = function(newPrice) {
      $scope.addNewOrder.inAsks.price = (Number(newPrice)-(0.0001)).toFixed(4);
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
          $scope.myOrders = response.data;
          $scope.$applyAsync();
          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem z pobraniem danych.');
          console.log(error);
        }
      });
    };

    $scope.myOrders = [];

    /*----------  Closing orders  ----------*/
    $scope.closeOrder__post = function(requestOptions) {
      var orderToClose = requestOptions.orderId;

      sendRequest({
        endpoint: '/api/v1/market/orders/close/'+orderToClose,
        method: 'post',
        apikey: $scope.apiCredentials.apiKey,
        secret: $scope.apiCredentials.secret,
        onSuccess: function(response) {

          if (response.data.orderId) {
            FlashingNotifications.showAndHideNotification('success', 'Zamknąłeś zlecenie.');
          }

          if (response.data && response.data.data && response.data.data.errors) {
            FlashingNotifications.showAndHideNotification('error', 'Problem.' + JSON.stringify(response.data.data.errors));
          }

          if (response.data.data) {
            FlashingNotifications.showAndHideNotification('error', 'Problem.' + JSON.stringify(response.data.data));
          }

          setTimeout(function() {
            $scope.refreshData(); //after adding new order refresh state of my orders
            //no need to $scope.$applyAsync(); because it is triggered in refreshData()
          }, 500); //timeout needed to give server some time to refersh data

          return response.data;
        },
        onError: function(error) {
          FlashingNotifications.showAndHideNotification('error', 'Problem.');
          console.log(error);
        }
      });
    };

    $scope.closeOrder__confirmCloseOrder = function(orderIdToClose) {
      $scope.closeOrder__post({
        orderId: orderIdToClose,
      });
    };

    $scope.closeOrder__showConfirmationButtons = function(event) {
      var thisParent = $(event.currentTarget).closest('[js-selector="cancel-offer-buttons-wrapper"]');
      thisParent.find('[js-selector="cancel-offer-confirm-buttons"]').removeClass('is-hidden');
      thisParent.find('[js-selector="cancel-offer-close-button"]').addClass('is-hidden');
    };

    $scope.closeOrder__hideConfirmationButtons = function(event) {
      var thisParent = $(event.currentTarget).closest('[js-selector="cancel-offer-buttons-wrapper"]');
      thisParent.find('[js-selector="cancel-offer-confirm-buttons"]').addClass('is-hidden');
      thisParent.find('[js-selector="cancel-offer-close-button"]').removeClass('is-hidden');
    };

    /*----------  Moment.js formatting times  ----------*/
    $scope.formattedTime = function(timeToFormat) {
      return moment(timeToFormat).fromNow();
    };

    /*----------  Refreshing data  ----------*/
    $scope.refreshData = function() {
      proTable__getAllData();
    };

    /*----------  Refreshing cycle progress bar  ----------*/
    function restartRefreshCycleProgressBar() {
      //the animation is based on CSS transition
      //if we change the refresh cycle time we need to change the CSS transition time
      var progressBarInnerBar = $('[js-selector="pro-progress-bar-inner-bar"]');
      progressBarInnerBar.removeClass('is-full');
      setTimeout(function() {
        progressBarInnerBar.addClass('is-full');
      }, 50); //needed to retrigger the CSS transition
    }

    /*----------  Warning when new order is too far from market  ----------*/
    $scope.checkIfOrderPriceIsNotTooFarFromMarket = function(priceToCheck, pair, inBidsOrInAsks) {
      var bestMarketPrice = {
        bid: $scope.orderbook__allPairs[pair].bids[0].price,
        ask: $scope.orderbook__allPairs[pair].asks[0].price,
      };

      var treshold = 0.01;
      var ratio;

      if (inBidsOrInAsks === 'inBids') {
        ratio = priceToCheck/bestMarketPrice.bid;
        if (ratio > (1 + treshold) ) {
          return window.confirm('Wprowadzony kurs różni się od rynkowego o ponad 1%. Czy jesteś pewien?');
        } else {
          return true;
        }
      } else if (inBidsOrInAsks === 'inAsks') {
        ratio = priceToCheck/bestMarketPrice.ask;
        console.log(ratio);
        if (ratio < (1 - treshold)) {
          return window.confirm('Wprowadzony kurs różni się od rynkowego o ponad 1%. Czy jesteś pewien?');
        } else {
          return true;
        }
      }
    };

    /*----------  Init  ----------*/
    function proTable__getPublicData() {
      $scope.exchangeRates__get();
      //$scope.marketPriceVolumes__getAllPairs(); Unused because similar data is downloaded by public API which is faster
      setTimeout(function() {
        $scope.orderbook__getAllPairs();
      }, 10); //timeout to ensure that API-NONCE is unique (signature is from different timestamp) otherwise api returns error
    }

    function proTable__getPrivateData() {
      if ($scope.apiCredentials.apiKey !== '') {
        $scope.walletState__get();
        setTimeout(function() {
          $scope.myOrders__get();
        }, 5); //timeout to ensure that API-NONCE is unique (signature is from different timestamp)
      }
    }

    function proTable__getAllData() {
      proTable__getPublicData();
      proTable__getPrivateData();
    }

    proTable__getAllData();
    restartRefreshCycleProgressBar();
    setInterval(function() {
      proTable__getAllData();
      restartRefreshCycleProgressBar();
    }, 10000);

    //Show config modal if no apikey provided
    if ($scope.apiCredentials.apiKey === '') {
      $scope.navigation__showAuthorisationModal();
    }

    $('[js-selector="initial-load-overlay"]').addClass('is-hidden');

    //TODO
    //Preloader po kliknięciu w button wysyłający request tak żeby coś się działo

});
