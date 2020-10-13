Java example
============

This example shows how to connect to Walutomat API from Java. It uses three calls to the API: gets current list of best offers, gets current user available funds and places an order.

In order to run the example code you need an apiKey and secret.

Running the example
-------------------

1. Compile example code

```
    $ javac com/currencyone/example/Example.java
```

1. Run example code

```
    $ java -DapiKey=MyAPIKey -Dsecret=MySecret com.currencyone.example.Example

    Current best offers
    {"pair":"EUR_PLN","bids":[{"price":"4.2632","baseVolume":"15266.08","marketVolume":"65082.36"},{"price":"4.2621","baseVolume":"159.51","marketVolume":"679.86"},{"price":"4.2620","baseVolume":"107165.15","marketVolume":"456737.93"},{"price":"4.2615","baseVolume":"300.61","marketVolume":"1281.06"},{"price":"4.2613","baseVolume":"9.36","marketVolume":"39.92"},{"price":"4.2610","baseVolume":"11744.34","marketVolume":"50042.70"},{"price":"4.2607","baseVolume":"234.70","marketVolume":"1000.00"},{"price":"4.2605","baseVolume":"73.57","marketVolume":"313.46"},{"price":"4.2603","baseVolume":"1971.69","marketVolume":"8400.00"},{"price":"4.2602","baseVolume":"3041.58","marketVolume":"12957.76"}],"asks":[{"price":"4.2639","baseVolume":"24.76","marketVolume":"105.57"},{"price":"4.2699","baseVolume":"3596.29","marketVolume":"15355.79"},{"price":"4.2700","baseVolume":"7000.00","marketVolume":"29890.00"},{"price":"4.2702","baseVolume":"36.47","marketVolume":"155.73"},{"price":"4.2707","baseVolume":"591.93","marketVolume":"2527.95"},{"price":"4.2708","baseVolume":"998.84","marketVolume":"4265.84"},{"price":"4.2715","baseVolume":"2000.00","marketVolume":"8543.00"},{"price":"4.2756","baseVolume":"23239.94","marketVolume":"99364.68"},{"price":"4.2757","baseVolume":"22525.73","marketVolume":"96313.26"},{"price":"4.2760","baseVolume":"1000.00","marketVolume":"4276.00"}]}

    My balance
    [{"currency":"CHF","balanceAll":"32.52","balanceAvailable":"32.52","balanceReserved":"0.00"},{"currency":"EUR","balanceAll":"19.62","balanceAvailable":"19.62","balanceReserved":"0.00"},{"currency":"PLN","balanceAll":"42.26","balanceAvailable":"20.81","balanceReserved":"21.45"},{"currency":"GBP","balanceAll":"1.00","balanceAvailable":"1.00","balanceReserved":"0.00"},{"currency":"USD","balanceAll":"16.43","balanceAvailable":"16.43","balanceReserved":"0.00"}]
    
    Placing an order
    {"orderId":"da1521bd-596a-43ff-9b2a-df14e7b2cba9","duplicate":false}
```
