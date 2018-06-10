using System;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;

namespace WalutomatApiExample
{
    class Program
    {
        static String pubkey = Environment.GetEnvironmentVariable("APIKEY");
        static String secret = Environment.GetEnvironmentVariable("SECRET");
        
        static void Main(string[] args)
        {
            String response = RunAsync().GetAwaiter().GetResult();
            Console.WriteLine("Received response with wallet balance:\n{0}", response);
            
            Console.ReadLine(); // keep applicaion window open until someone reads it's output
        }

        static async Task<String> RunAsync()
        {
            String endpoint = "/api/v1/account/balances";
            String ts = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();

            ASCIIEncoding encoding = new ASCIIEncoding();
            HMACSHA256 hmac = new HMACSHA256(encoding.GetBytes(secret));
            byte[] docBytes = encoding.GetBytes(endpoint + ts);
            byte[] hash = hmac.ComputeHash(docBytes);
            string signature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri("https://api.walutomat.pl/");
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Add("X-API-KEY", pubkey);
            client.DefaultRequestHeaders.Add("X-API-NONCE", ts);
            client.DefaultRequestHeaders.Add("X-API-SIGNATURE", signature);
                
            HttpResponseMessage response = await client.GetAsync(endpoint);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
            throw new InvalidOperationException(await response.Content.ReadAsStringAsync());
        }

    }
}
