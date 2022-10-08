const express = require("express");
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get("/latest", async (req, res) => {
  const { TEST_CLIENT_ID, TEST_CLIENT_SECRET, LNDHUB_LOGIN, LNDHUB_PASSWORD } = process.env

  console.info("Requestion code");
  // fetch an access token
  const authResponse = await axios({
    method: "POST",
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    url: `https://api.getalby.com/oauth/authorize`,
    maxRedirects: 0,
    validateStatus: function (status) {
      return status < 400; // Resolve only if the status code is less than 400
    },
    data: `client_id=${TEST_CLIENT_ID}&redirect_uri=http://localhost:8080&response_type=code&scope=invoices:read&login=${LNDHUB_LOGIN}&password=${LNDHUB_PASSWORD}`
  });

  const url = authResponse.headers.location;
  const code = url.replace("http://localhost:8080?code=", "");;

  console.info("requesting access token");
  const tokenResponse = await axios({
    method: "POST",
    url: `https://api.getalby.com/oauth/token`,
    auth: { username: TEST_CLIENT_ID, password: TEST_CLIENT_SECRET},
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    maxRedirects: 0,
    data: `code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:8080`
  });

  const token = tokenResponse.data.access_token;

  const invoicesResponse = await axios({
    method: "GET",
    url: "https://api.getalby.com/invoices/incoming",
    headers: {'Authorization': `Bearer ${token}` }
  });

  const latest = invoicesResponse.data[0];

  res.json({by: `${latest.payer_name} (who recently dropped ${latest.amount} sats)`, comment: latest.comment});
});

app.listen(port, () => console.log(`app listening on port ${port}!`))

