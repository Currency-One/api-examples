using System;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using System.Security.Cryptography;

namespace WalutomatApiExample
{
    class Program
    {
        static String pubkey = Environment.GetEnvironmentVariable("APIKEY");
        static String secret = Environment.GetEnvironmentVariable("SECRET");

        static void Main(string[] args)
        {
            RunAsync().GetAwaiter().GetResult();
        }

        static async Task RunAsync()
        {
            Console.WriteLine("Current orderbook:\n{0}", await GetOrderbook());
            Console.WriteLine("My balance:\n{0}", await GetBalance());
            Console.WriteLine("Placing an order:\n{0}", await PlaceOrder());

            Console.ReadLine(); // keep applicaion window open until someone reads it's output
        }

        static async Task<String> GetOrderbook()
        {
            return await RequestAsync("/api/v1/public/market/orderbook/EUR_PLN");
        }

        static async Task<String> GetBalance()
        {
            return await RequestSignedAsync(HttpMethod.Get, "/api/v1/account/balances");
        }

        static async Task<String> PlaceOrder()
        {
            return await RequestSignedAsync(HttpMethod.Post, "/api/v1/market/orders"
            + "?submitId=" + Guid.NewGuid().ToString()
            + "&pair=EUR_PLN"
            + "&price=4.231"
            + "&buySell=BUY"
            + "&volume=1.00"
            + "&volumeCurrency=EUR"
            + "&otherCurrency=PLN");
        }

        static async Task<String> RequestAsync(String uri)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri("https://api.walutomat.pl/");

            HttpResponseMessage response = await client.GetAsync(uri);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
            throw new InvalidOperationException(await response.Content.ReadAsStringAsync());
        }

        static async Task<String> RequestSignedAsync(HttpMethod method, String uri)
        {
            String ts = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();

            UTF8Encoding utf8 = new UTF8Encoding();
            HMACSHA256 hmac = new HMACSHA256(utf8.GetBytes(secret));
            byte[] docBytes = utf8.GetBytes(uri + ts);
            byte[] hash = hmac.ComputeHash(docBytes);
            string signature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri("https://api.walutomat.pl/");
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Add("X-API-KEY", pubkey);
            client.DefaultRequestHeaders.Add("X-API-NONCE", ts);
            client.DefaultRequestHeaders.Add("X-API-SIGNATURE", signature);

            HttpRequestMessage requestMessage = new HttpRequestMessage(method, uri);
            HttpResponseMessage response = await client.SendAsync(requestMessage);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
            throw new InvalidOperationException(await response.Content.ReadAsStringAsync());
        }

    }
}
