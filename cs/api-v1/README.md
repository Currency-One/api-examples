C# example
============

This example shows how to connect to Walutomat API from C#. It uses three calls to the API: gets current list of best offers, gets current user available funds and places an order.

In order to run the example code you need an apiKey and secret.

Running the example
-------------------

1. Compile example code

```
    $ msbuild Example.csproj 
    ...
    Build succeeded.
        0 Warning(s)
        0 Error(s)

    Time Elapsed 00:00:01.08
```

1. Run example code

```
    $ APIKEY=secret SECRET=secret bin/Debug/WalutomatApiExample.exe
    Current orderbook:
    {"pair":"EUR_PLN","bids":[{"price":"4.2650","baseVolume":"5558.83","marketVolume":"23708.49"},{"price":"4.2649","baseVolume":"511.01","marketVolume":"2179.41"},{"price":"4.2646","baseVolume":"3001.50","marketVolume":"12800.20"},{"price":"4.2644","baseVolume":"3001.50","marketVolume":"12799.60"},{"price":"4.2642","baseVolume":"2262.54","marketVolume":"9647.94"},{"price":"4.2641","baseVolume":"3676.16","marketVolume":"15675.52"},{"price":"4.2640","baseVolume":"2345.21","marketVolume":"10000.00"},{"price":"4.2638","baseVolume":"644.96","marketVolume":"2750.00"},{"price":"4.2636","baseVolume":"19884.94","marketVolume":"84781.44"},{"price":"4.2635","baseVolume":"4690.98","marketVolume":"20000.00"}],"asks":[{"price":"4.2698","baseVolume":"3417.59","marketVolume":"14592.42"},{"price":"4.2699","baseVolume":"1894.44","marketVolume":"8089.06"},{"price":"4.2700","baseVolume":"1395.22","marketVolume":"5957.58"},{"price":"4.2703","baseVolume":"10000.00","marketVolume":"42703.00"},{"price":"4.2709","baseVolume":"36.62","marketVolume":"156.40"},{"price":"4.2719","baseVolume":"14264.93","marketVolume":"60938.35"},{"price":"4.2720","baseVolume":"10180.00","marketVolume":"43488.96"},{"price":"4.2726","baseVolume":"10000.00","marketVolume":"42726.00"},{"price":"4.2728","baseVolume":"1000.00","marketVolume":"4272.80"},{"price":"4.2730","baseVolume":"15730.00","marketVolume":"67214.29"}]}
    My balance:
    [{"currency":"CHF","balanceAll":"32.52","balanceAvailable":"32.52","balanceReserved":"0.00"},{"currency":"EUR","balanceAll":"19.62","balanceAvailable":"19.62","balanceReserved":"0.00"},{"currency":"PLN","balanceAll":"42.26","balanceAvailable":"20.81","balanceReserved":"21.45"},{"currency":"GBP","balanceAll":"1.00","balanceAvailable":"1.00","balanceReserved":"0.00"},{"currency":"USD","balanceAll":"16.43","balanceAvailable":"16.43","balanceReserved":"0.00"}]
    Placing an order:
    {"orderId":"c3b96710-41fd-4b40-a421-88c2b6a06d9b","duplicate":false}
```
