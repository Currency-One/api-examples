# Ruby API v2 examples

The examples below are compliant with [**Walutomat API v2 Documentation**](https://api.walutomat.pl/v2.0.0/ )

## Usage

1. Install the required gems with:
   ```bash
   bundle install
   ```

2. Follow the instruction in [**Walutomat API v2 Documentation**](https://api.walutomat.pl/v2.0.0/ ) to generate keys. 

    1. To generate an RSA key pair execute the following commands:

        ```bash
        $ openssl genrsa -out ./private.key 4096
        $ openssl rsa -in ./private.key -pubout -out ./public.key
        ```

    2. Once the RSA Key pair is generated, the API KEY can be obtained in your **Walutomat** account. Make sure to use the **public.key**.

3. Put your API key (the one from Walutomat not one of the public/private pair) in `api_key` file in this directory

4. Put your private RSA key in `private.key` file in this directory

5. Run any of the files with `ruby <filename>` e.g. `ruby GET-account-balances.rb`

    1. You can pipe the output directly to JSON processor e.g. `jq` - example command `ruby GET-account-balances.rb | jq`
    2. Responses look exactly like the one specified in [the documentation](https://api.walutomat.pl/v2.0.0/). Example:  
    ```
    {
          "success": true,
          "result": [
            {
              "currency": "PLN",
              "balanceTotal": "9734.44",
              "balanceAvailable": "4293.30",
              "balanceReserved": "5441.14"
            },
            {
              "currency": "CHF",
              "balanceTotal": "211.15",
              "balanceAvailable": "211.15",
              "balanceReserved": "0.00"
            },
            {
              "currency": "EUR",
              "balanceTotal": "9863.41",
              "balanceAvailable": "9863.41",
              "balanceReserved": "0.00"
            }
          ]
        }
    ```