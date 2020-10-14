const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const app = express();

app.use(express.static(path.join(__dirname, '/docroot')));
app.use(bodyParser.json());

app.post('/api', function(request, response) {
  if (request.body.body === '') {
    delete request.body.body;
  }
  console.log('Sending request: ', request.body);
  axios(request.body)
    .then(res => response.send(res.data))
    .catch(error => {
      response.send({
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
    });
});

app.listen(port);
console.log(`server started on port http://localhost:${port}`);
