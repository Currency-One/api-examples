using System;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using Org.BouncyCastle.Security;

namespace WalutomatApiV2Example
{
    class Program
    {
        static string host = "https://api.walutomat.pl";
        static void Main(string[] args)
        {
            switch (args.Length > 0 ? args[0] : "")
            {
                case "orders-active":
                    GetActiveOrders();
                    break;
                case "wallet-balance":
                    GetWalletBalance();
                    break;
                case "order-create":
                    CreateOrder();
                    break;
                case "order-withdraw":
                    if (args.Length == 2) {
                        WithdrawOrder(args[1]);
                        return;
                    }
                    WriteDefaultMessage();
                    break;
                default:
                    WriteDefaultMessage();
                    break;
            }
        }

        static void GetActiveOrders()
        {
            string now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            string endpoint = "/api/v2.0.0/market_fx/orders/active";
            string stringToSign = now + endpoint;

            var http = new HttpClient();
            var req = new HttpRequestMessage(HttpMethod.Get, host + endpoint);
            req.Headers.Add("X-API-Key", GetApiKey());
            req.Headers.Add("X-API-Signature", Sign(stringToSign));
            req.Headers.Add("X-API-Timestamp", now);

            var res = http.SendAsync(req).Result;
            Console.WriteLine(res.Content.ReadAsStringAsync().Result);
        }

        static void CreateOrder()
        {
            string submitId = Guid.NewGuid().ToString();
            string now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            string endpoint = "/api/v2.0.0/market_fx/orders";
            var param = new Dictionary<String, String>(){
                { "currencyPair", "EURPLN" },
                { "buySell", "BUY" },
                { "volume", "90.00" },
                { "volumeCurrency", "EUR" },
                { "limitPrice", "4.2456" },
                { "dryRun", "false" },
                { "submitId", submitId }
            };

            var content = new FormUrlEncodedContent(param);
            string stringToSign = now + endpoint + content.ReadAsStringAsync().Result;

            var http = new HttpClient();
            var req = new HttpRequestMessage(HttpMethod.Post, host + endpoint);
            req.Headers.Add("X-API-Key", GetApiKey());
            req.Headers.Add("X-API-Signature", Sign(stringToSign));
            req.Headers.Add("X-API-Timestamp", now);

            req.Content = content;

            var res = http.SendAsync(req).Result.Content.ReadAsStringAsync().Result;

            Console.WriteLine(res);
        }

        static void WithdrawOrder(string orderId)
        {
            string submitId = Guid.NewGuid().ToString();
            string now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            string endpoint = "/api/v2.0.0/market_fx/orders/close";
            var param = new Dictionary<String, String>(){
                { "orderId", orderId },
            };

            var content = new FormUrlEncodedContent(param);
            string stringToSign = now + endpoint + content.ReadAsStringAsync().Result;

            var http = new HttpClient();
            var req = new HttpRequestMessage(HttpMethod.Post, host + endpoint);
            req.Headers.Add("X-API-Key", GetApiKey());
            req.Headers.Add("X-API-Signature", Sign(stringToSign));
            req.Headers.Add("X-API-Timestamp", now);

            req.Content = content;

            var res = http.SendAsync(req).Result;
            Console.WriteLine(res.Content.ReadAsStringAsync().Result);
        }

        static void GetWalletBalance()
        {
            string now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            string endpoint = "/api/v2.0.0/account/balances";
            string stringToSign = now + endpoint;

            var http = new HttpClient();
            var req = new HttpRequestMessage(HttpMethod.Get, host + endpoint);
            req.Headers.Add("X-API-Key", GetApiKey());
            req.Headers.Add("X-API-Signature", Sign(stringToSign));
            req.Headers.Add("X-API-Timestamp", now);

            var res = http.SendAsync(req).Result;
            Console.WriteLine(res.Content.ReadAsStringAsync().Result);
        }

        static string Sign(string stringToSign)
        {
            var privateKey = File.ReadAllText("private.key");
            byte[] bytesToSign = Encoding.UTF8.GetBytes(stringToSign);
            var pemReader = new PemReader(new StringReader(privateKey));
            var keyPair = (AsymmetricCipherKeyPair)pemReader.ReadObject();
            var rsaParameters = DotNetUtilities.ToRSAParameters((RsaPrivateCrtKeyParameters)keyPair.Private);

            using (var rsa = new RSACryptoServiceProvider())
            {
                rsa.ImportParameters(rsaParameters);
                var encryptedData = rsa.SignData(bytesToSign, CryptoConfig.MapNameToOID("SHA256"));
                var base64Encrypted = Convert.ToBase64String(encryptedData);
                return base64Encrypted;
            }
        }

        static string GetApiKey()
        {
            return File.ReadAllText("api_key");
        }

        static void WriteDefaultMessage()
        {
            Console.WriteLine("Run the program with any of these arguments: \n* orders-active, \n* wallet-balance, \n* order-create, \n* order-withdraw {orderId}");
        }
    }
}
