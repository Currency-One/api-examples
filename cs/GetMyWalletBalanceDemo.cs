using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;

namespace HelloValutoAPI
{
    /// <summary>
    /// This is simple Valuto API client. 
    /// It retrieves current Valuto wallet balance.
    /// It demonstrates:
    ///  - how to create correct X-API-NONCE request header 
    ///  - how to sign request 
    ///  - how to send request and receive response over REST
    /// </summary>
    class GetMyWalletBalanceDemo
    {
        //this is Valuto API address (modify when needed, e.g. to correct API version)
        static String valutoAddress = "https://api.walutomat.pl/";
        //paste here your API integration key, contact Valuto team if you do not have one
        static String pubkey = "bbbbbbbbbbbbbbbbbbbbbbbbb";
        //paste here your secret key for request signing, make your secret confidential!, it is recommended to change keys after tests in final integration
        static String secret = "aaaaaaaaaaaaaaaaaaaaaaaaa";

        static HttpClient client = new HttpClient();

        static async Task<String> GetBalanceAsync(string path)
        {
            String balance = "";
            HttpResponseMessage response = await client.GetAsync(path);
            if (response.IsSuccessStatusCode)
            {
                balance = await response.Content.ReadAsStringAsync();
                //Balance balance = await response.Content.ReadAsAsync<Balance>();
            }
            return balance;
        }

        static void Main(string[] args)
        {
            RunAsync().GetAwaiter().GetResult();
        }

        static async Task RunAsync()
        {
            client.BaseAddress = new Uri(valutoAddress);
            //this is endpoint for retreiving wallet balance according to API documentation
            String endpoint = "api/v1/account/balances";
            String requestParams = "";

            //prepare request headers according to API documentation
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add("X-API-KEY", pubkey);
            //X-API-NONCE header should contain number of miliseconds elapsed from Unix epoch
            String ts = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();
            client.DefaultRequestHeaders.Add("X-API-NONCE", ts);
            Console.WriteLine("X-API-NONCE header set to: {0}", ts);
            //X-API-SIGNATURE should contain request signature, generated below
            ASCIIEncoding encoding = new ASCIIEncoding();
            HMACSHA256 hmac = new HMACSHA256(encoding.GetBytes(secret));
            String documentToSign = new StringBuilder().Append("/").Append(endpoint).Append(ts).Append(requestParams).ToString();
            Console.WriteLine("Document to sign: {0}", documentToSign);
            byte[] docBytes = encoding.GetBytes(documentToSign);
            byte[] hash = hmac.ComputeHash(docBytes);
            string signature = BitConverter.ToString(hash).Replace("-", "").ToLower();
            client.DefaultRequestHeaders.Add("X-API-SIGNATURE", signature);
            Console.WriteLine("X-API-SIGNATURE header set to: {0}",signature);

            try
            {
                String response = await GetBalanceAsync(client.BaseAddress + endpoint);
                Console.WriteLine("Received response with wallet balance:\n{0}",response);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }

            Console.ReadLine();
        }

    }
}
