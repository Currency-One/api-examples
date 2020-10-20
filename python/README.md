# Python API v2 examples

The examples below are compliant with [**Walutomat API v2 Documentation**](https://api.walutomat.pl/v2.0.0/ )

## Requirements

1. In order to execute the scripts, they first need to be **executable**. To make them executable, type the command below in the current directory:
```bash
chmod u+x *.py
```

2. Install **requirements** by:
```bash
pip3 install -r requirements.txt
```

### RSA Key pair
To generate an RSA key pair execute the following commands:

```bash
$ openssl genrsa -out ./private.key 4096
$ openssl rsa -in ./private.key -pubout -out ./public.key
```

### API KEY
Once the RSA Key pair is generated, the API KEY can be obtained in your **Walutomat** account. Make sure to use the **public.key**. 
![api_key_eng](../../images/api_key.png)

When the API KEY is generated, copy its value to **./api_key** and save the file.

---
## Examples

### Return wallet balance
[**Wallet balance documentation**](https://api.walutomat.pl/v2.0.0/#operation/getBalances)

```bash
$ python3 wallet-get.py
```
Output:
```
Your current wallet balance is: {
   "success":true,
   "result":[
      {
         "currency":"PLN",
         "balanceTotal":"555555481997.00",
         "balanceAvailable":"555555481231.24",
         "balanceReserved":"765.76"
      },
      {
         "currency":"EUR",
         "balanceTotal":"2055030.46",
         "balanceAvailable":"2055030.46",
         "balanceReserved":"0.00"
      }
   ]
}
```

### Create order
[**Create order documentation**](https://api.walutomat.pl/v2.0.0/#operation/newOrder)

```bash
$ python3 order-create.py
```
Output:
```
Created order:
{
   "success":true,
   "duplicate":false,
   "result":{
      "orderId":"c9bd63ef-7988-4ea3-9d26-b3d0f5b2b3f9"
   }
}
```

### Withdraw order
[**Withdraw order documentation**](https://api.walutomat.pl/v2.0.0/#operation/cancelOrder)

To withdraw an order, it needs to be created beforehand. Please use the **create-order** API for that. Once orderId is returned, edit **./order-withdraw.py** file as shown below:

```python
API_KEY = open('./api_key').read()

## Assign the orderId to the variable below
ORDER_ID = 'c9bd63ef-7988-4ea3-9d26-b3d0f5b2b3f9'

assert API_KEY is not None
assert ORDER_ID is not None
```

Then run the command below:

```bash
$ python3 order-withdraw.py
```
Output:
```
Withdrawn order: 
{
   "success":true,
   "errors":[

   ],
   "result":{
      "orderId":"c9bd63ef-7988-4ea3-9d26-b3d0f5b2b3f9",
      "submitId":"ffaeb678-7ef8-4850-ba1b-7ecebf844710",
      "submitTs":"2020-03-24T09:31:53.285691Z",
      "updateTs":"2020-03-24T09:33:32.230450Z",
      "status":"CLOSED",
      "completion":0,
      "currencyPair":"EURPLN",
      "buySell":"BUY",
      "volume":"90.00",
      "volumeCurrency":"EUR",
      "limitPrice":"4.2456",
      "soldAmount":"0.00",
      "soldCurrency":"PLN",
      "boughtAmount":"0.00",
      "boughtCurrency":"EUR",
      "commissionRate":"0.0020"
   }
}
```

### Return active orders
[**Active orders documentation**](https://api.walutomat.pl/v2.0.0/#operation/findActiveOrders)

```bash
$ python3 offers-get.py
```
Output:
```
List of active offers: 
{
   "success":true,
   "result":[
      {
         "orderId":"070620ac-a8df-41f9-81fb-23364485cb3a",
         "submitId":"3ab310db-9ce4-49d6-b8c4-5ed7875bca95",
         "submitTs":"2020-03-23T15:09:16.039163Z",
         "updateTs":"2020-03-23T15:09:16.201646Z",
         "status":"ACTIVE",
         "completion":0,
         "currencyPair":"EURPLN",
         "buySell":"BUY",
         "volume":"90.00",
         "volumeCurrency":"EUR",
         "limitPrice":"4.2456",
         "soldAmount":"0.00",
         "soldCurrency":"PLN",
         "boughtAmount":"0.00",
         "boughtCurrency":"EUR",
         "commissionRate":"0.0020"
      },
      {
         "orderId":"0dd866a6-51dd-429b-9e85-f9d202b173d2",
         "submitId":"7663343e-918f-475f-99c0-9e0a8443df11",
         "submitTs":"2020-03-23T14:30:04.905401Z",
         "updateTs":"2020-03-23T14:30:05.074236Z",
         "status":"ACTIVE",
         "completion":0,
         "currencyPair":"EURPLN",
         "buySell":"BUY",
         "volume":"90.00",
         "volumeCurrency":"EUR",
         "limitPrice":"4.2456",
         "soldAmount":"0.00",
         "soldCurrency":"PLN",
         "boughtAmount":"0.00",
         "boughtCurrency":"EUR",
         "commissionRate":"0.0020"
      }
   ]
}
```

### Return account history
[**Account history documentation**](https://api.walutomat.pl/v2.0.0/#operation/getBalances)

```
{
   "success":true,
   "result":[
      {
         "historyItemId":14,
         "transactionId":"3bdd4079-eb8c-441e-81b6-1c5406b285c6",
         "ts":"2020-05-07T10:32:13.549Z",
         "operationAmount":"-1500.00 PLN",
         "balanceAfter":"12409.17 PLN",
         "operationDetails":[
            {
               "key":"destinationAccount",
               "value":"PL90116010741762535309877248"
            },
            {
               "key":"ownerName",
               "value":"John Wick"
            },
            {
               "key":"ownerAddress",
               "value":"Engestroma 20/4, 60-571 Poznań PL"
            },
            {
               "key":"country",
               "value":"PL"
            },
            {
               "key":"transferTitle",
               "value":"ID 3bdd4079 Przelew z Walutomatu"
            }
         ],
         "currency":"PLN",
         "operationType":"PAYOUT",
         "operationDetailedType":"PAYOUT",
         "submitId":"653d79df-f17a-4961-a356-dd7387df7f98"
      },
      {
         "historyItemId":13,
         "transactionId":"0616b0f8-9609-42ac-94d8-98ab5f0b7e72",
         "ts":"2020-05-07T09:54:50.537Z",
         "operationAmount":"150.00 PLN",
         "balanceAfter":"13909.17 PLN",
         "operationDetails":[
            {
               "key":"ownerName",
               "value":"John Doe"
            },
            {
               "key":"ownerAddress",
               "value":"Kochanowskiego 13, 02-152 Warszawa PL"
            },
            {
               "key":"country",
               "value":"PL"
            },
            {
               "key":"transferTitle",
               "value":"ID 0616b0f8 Przelew od John Wick (via Walutomat.pl)"
            }
         ],
         "currency":"PLN",
         "correctingEntry":true,
         "operationType":"PAYOUT",
         "operationDetailedType":"THIRD_PARTY_PAYOUT",
         "submitId":"54ea21c0-f436-49db-b682-909c681c7c45"
      },
      {
         "historyItemId":12,
         "transactionId":"0616b0f8-9609-42ac-94d8-98ab5f0b7e72",
         "ts":"2020-05-07T09:53:15.466Z",
         "operationAmount":"-150.00 PLN",
         "balanceAfter":"13759.17 PLN",
         "operationDetails":[
            {
               "key":"ownerName",
               "value":"John Doe"
            },
            {
               "key":"ownerAddress",
               "value":"Kochanowskiego 13, 02-152 Warszawa PL"
            },
            {
               "key":"country",
               "value":"PL"
            },
            {
               "key":"transferTitle",
               "value":"ID 0616b0f8 Przelew od John Wick (via Walutomat.pl)"
            }
         ],
         "currency":"PLN",
         "operationType":"PAYOUT",
         "operationDetailedType":"THIRD_PARTY_PAYOUT",
         "submitId":"54ea21c0-f436-49db-b682-909c681c7c45"
      },
      {
         "historyItemId":11,
         "transactionId":"adc4eedf-c888-498b-84cb-2b30a3c5209f/f3b5e8be-c453-483f-9ebc-607a7adf1ba3",
         "ts":"2020-05-07T09:51:47.056Z",
         "operationAmount":"-1090.83 PLN",
         "balanceAfter":"13909.17 PLN",
         "operationDetails":[
            {
               "key":"orderId",
               "value":"adc4eedf-c888-498b-84cb-2b30a3c5209f"
            },
            {
               "key":"currencyPair",
               "value":"EUR_PLN"
            },
            {
               "key":"buySell",
               "value":"BUY"
            },
            {
               "key":"orderVolume",
               "value":"250.00 EUR"
            }
         ],
         "currency":"PLN",
         "operationType":"MARKET_FX",
         "operationDetailedType":"MARKET_FX",
         "submitId":"03ed4904-9652-4f75-901f-b237bb596901"
      },
      {
         "historyItemId":10,
         "transactionId":"adc4eedf-c888-498b-84cb-2b30a3c5209f/f3b5e8be-c453-483f-9ebc-607a7adf1ba3",
         "ts":"2020-05-07T09:51:47.056Z",
         "operationAmount":"-0.50 EUR",
         "balanceAfter":"250.00 EUR",
         "operationDetails":[
            {
               "key":"orderId",
               "value":"adc4eedf-c888-498b-84cb-2b30a3c5209f"
            },
            {
               "key":"currencyPair",
               "value":"EUR_PLN"
            },
            {
               "key":"buySell",
               "value":"BUY"
            },
            {
               "key":"orderVolume",
               "value":"250.00 EUR"
            }
         ],
         "currency":"EUR",
         "operationType":"COMMISSION",
         "operationDetailedType":"MARKET_FX_FEE",
         "submitId":"03ed4904-9652-4f75-901f-b237bb596901"
      },
      {
         "historyItemId":9,
         "transactionId":"adc4eedf-c888-498b-84cb-2b30a3c5209f/f3b5e8be-c453-483f-9ebc-607a7adf1ba3",
         "ts":"2020-05-07T09:51:47.056Z",
         "operationAmount":"250.50 EUR",
         "balanceAfter":"250.50 EUR",
         "operationDetails":[
            {
               "key":"orderId",
               "value":"adc4eedf-c888-498b-84cb-2b30a3c5209f"
            },
            {
               "key":"currencyPair",
               "value":"EUR_PLN"
            },
            {
               "key":"buySell",
               "value":"BUY"
            },
            {
               "key":"orderVolume",
               "value":"250.00 EUR"
            }
         ],
         "currency":"EUR",
         "operationType":"MARKET_FX",
         "operationDetailedType":"MARKET_FX",
         "submitId":"03ed4904-9652-4f75-901f-b237bb596901"
      },
      {
         "historyItemId":7,
         "transactionId":"payIn1588845034645",
         "ts":"2020-05-07T09:50:59.069Z",
         "operationAmount":"15000.00 PLN",
         "balanceAfter":"15000.00 PLN",
         "operationDetails":[
            {
               "key":"transferTitle",
               "value":"WX24512483WX"
            },
            {
               "key":"senderName",
               "value":"string"
            },
            {
               "key":"sourceAccount",
               "value":"PL90116010741762535309877248"
            },
            {
               "key":"destinationAccount",
               "value":"PL69249000050000460013105533"
            }
         ],
         "currency":"PLN",
         "operationType":"PAYIN",
         "operationDetailedType":"PAYIN"
      }
   ]
}
```