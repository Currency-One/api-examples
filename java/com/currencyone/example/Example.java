package com.currencyone.example;

import java.io.InputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class Example 
{
    public static String APIKEY = System.getProperty("apiKey");
    public static String SECRET = System.getProperty("secret");

    public static void main( String[] args ) throws Exception {
            System.out.println("Current best offers");
            System.out.println(Example.getOrderbook());
            System.out.println("\nMy balance");
            System.out.println(Example.getBalance());
            System.out.println("\nPlacing an order");
            System.out.println(Example.placeOrder());
    }

    public static String getOrderbook() throws IOException {
        return makeUnsignedRequest("/api/v1/public/market/orderbook/EUR_PLN");
    }

    public static String getBalance() throws Exception {
        return makeSignedRequest("GET", "/api/v1/account/balances");
    }

    public static String placeOrder() throws Exception {
        String uuid = UUID.randomUUID().toString();
        return makeSignedRequest("POST", "/api/v1/market/orders?submitId=" 
            + uuid + "&pair=EUR_PLN&price=4.231&buySell=BUY&volume=1.00&volumeCurrency=EUR&otherCurrency=PLN");
    }

    public static String makeUnsignedRequest(String uri) throws IOException {
        URL url = new URL("https://api.walutomat.pl" + uri);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        return connectionResponseToString(connection);
    }

    public static String makeSignedRequest(String method, String uri) throws Exception {
        Long ts = System.currentTimeMillis();
        String signature = encode(SECRET, uri + ts);
        URL url = new URL("https://api.walutomat.pl" + uri);

        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setRequestProperty("X-API-KEY", APIKEY);
        connection.setRequestProperty("X-API-NONCE", ts.toString());
        connection.setRequestProperty("X-API-SIGNATURE", signature);
        return connectionResponseToString(connection);
    }

    public static String connectionResponseToString(HttpURLConnection connection) throws IOException {
        InputStream is;
        if (200 <= connection.getResponseCode() && connection.getResponseCode() <= 299) {
            is = connection.getInputStream(); 
        } else {
            is = connection.getErrorStream();
        }
        java.util.Scanner s = new java.util.Scanner(is).useDelimiter("\\A");
        return s.hasNext() ? s.next() : "";
    }

    public static String encode(String key, String data) throws Exception {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes("UTF-8"), "HmacSHA256");
            sha256_HMAC.init(secret_key);

            return bytesToHex(sha256_HMAC.doFinal(data.getBytes("UTF-8")));
        } catch (UnsupportedEncodingException ex) {
            return null;
        }
    }

    public static String bytesToHex(byte[] bytes) {
        char[] hexArray = "0123456789abcdef".toCharArray();
        char[] hexChars = new char[bytes.length * 2];
        for ( int j = 0; j < bytes.length; j++ ) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }
        return new String(hexChars);
    }

}
