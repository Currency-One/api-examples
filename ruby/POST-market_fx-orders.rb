require 'securerandom'
require 'net/http'
require 'base64'

base_url = 'https://api.walutomat.pl'
endpoint = '/api/v2.0.0/market_fx/orders'

timestamp = Time.now.utc.strftime('%Y-%m-%dT%H:%M:%SZ')

submit_id = SecureRandom.uuid

body = {
  currencyPair: 'EURPLN',
  buySell: 'BUY',
  volume: '90.00',
  volumeCurrency: 'EUR',
  limitPrice: '4.2456',
  dryRun: 'false',
  submitId: submit_id,
}

url_encoded = URI.encode_www_form(body)

data_to_be_signed = "#{timestamp}#{endpoint}#{url_encoded}"

key = OpenSSL::PKey::RSA.new(File.read('private.key'))
digest = OpenSSL::Digest::SHA256.new
signature = key.sign(digest, data_to_be_signed)
signature_base64 = Base64.strict_encode64(signature)

api_key = File.read('api_key')

headers = {
  'X-API-Key': api_key,
  'X-API-Signature': signature_base64,
  'X-API-Timestamp': timestamp,
  'Content-Type': 'application/x-www-form-urlencoded',
}

uri = URI.parse("#{base_url}#{endpoint}")

https = Net::HTTP.new(uri.host, uri.port)
https.use_ssl = base_url.start_with? 'https'

request = Net::HTTP::Post.new(uri.request_uri, headers)
request.body = url_encoded

response = https.request(request)

puts response.body
