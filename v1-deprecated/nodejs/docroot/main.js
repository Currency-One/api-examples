new Vue({
  el: '#app',
  data: {
    url: localStorage.getItem('url') || 'https://api.walutomat.pl',
    endpoint: localStorage.getItem('endpoint') || '/api/v1/account/balances',
    apikey: localStorage.getItem('apikey') || 'example apikey',
    secret: localStorage.getItem('secret') || 'example secret',
    method: localStorage.getItem('method') || 'GET',
    timestamp: '' + (new Date()).getTime(),
    sign: '',
    request: {},
    response: {},
    body: ''
  },
  watch: {
    url: val => localStorage.setItem('url', val),
    endpoint: val => localStorage.setItem('endpoint', val),
    apikey: val => localStorage.setItem('apikey', val),
    secret: val => localStorage.setItem('secret', val),
    method: val => localStorage.setItem('method', val),
    body: val => localStorage.setItem('body', val)
  },
  methods: {
    updateRequest: function() {
      this.timestamp = '' + (new Date()).getTime();
      const shaObj = new jsSHA('SHA-256', 'TEXT');
      shaObj.setHMACKey(this.secret, 'TEXT');
      shaObj.update(this.endpoint + this.timestamp);
      this.sign = shaObj.getHMAC('HEX');

      this.request = JSON.stringify({
        method: this.method.toLowerCase(),
        url: this.url + this.endpoint,
        body: this.body,
        headers: {
          'X-API-KEY': this.apikey,
          'X-API-NONCE': this.timestamp,
          'X-API-SIGNATURE': this.sign
        }
      }, null, 4);
    },
    sendRequest: function() {
      this.updateRequest();
      this.response = 'Loading...';
      axios.post('/api', JSON.parse(this.request))
        .then(response => {
          this.response = response.data;
        })
        .catch(e => {
          this.response = '(see console for details)\n' + e.message;
        });
    }
  }
});
