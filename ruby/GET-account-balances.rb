require 'net/http'
require 'base64'

base_url = 'https://api.walutomat.pl'
endpoint = '/api/v2.0.0/account/balances'

timestamp = Time.now.utc.strftime('%Y-%m-%dT%H:%M:%SZ')

data_to_be_signed = "#{timestamp}#{endpoint}"

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

request = Net::HTTP::Get.new(uri.request_uri, headers)

response = https.request(request)

puts response.body
