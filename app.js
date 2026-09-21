// Import Express.js
const express = require('express');
// Create an Express app
const app = express();
// Middleware to parse JSON bodies
app.use(express.json());
// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
// Hardcoded travel prices (in MYR) for Malaysian cities
const cityPrices = {
  'penang': 120,
  'kuala lumpur': 150,
  'johor bahru': 180,
  'malacca': 90,
  'ipoh': 110,
  'kuching': 250,
  'kota kinabalu': 300,
  'langkawi': 200,
};

const memberMiles = {
  '1112201': 12000,
  '1130011': 45000,
  '1501235': 8000,
  '2001111': 73000,
};

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});
// Route to get the travel price for a Malaysian city
app.get('/prices', (req, res) => {
  console.log("Prices Connector called");
  return res.status(200).json({ currency: 'MYR', prices: cityPrices });
});

// Route to get the travel price for a Malaysian city
app.get('/prices/city/:cityName', (req, res) => {
  console.log("Prices Connector with city name called");
  const { cityName } = req.params;
  const normalizedCity = cityName.trim().toLowerCase();
  console.log("Enquiring city: " + normalizedCity);
  const price = cityPrices[normalizedCity];
  if (price === undefined) {
    console.log("Price not found");
    return res.status(404).json({
      error: `No price found for city "${cityName}"`,
      availableCities: Object.keys(cityPrices),
    });
  }
  res.status(200).json({ city: cityName, currency: 'MYR', price });
});

/*
// Route for POST requests
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).end();
});
*/

// Route for POST requests
app.post('/', (req, res) => {
  const value = req.body?.entry?.[0]?.changes?.[0]?.value;
  const statuses = value?.statuses;
  const messages = value?.messages;
  if (statuses) {
    for (const { id, status } of statuses) {
      console.log(`Message ID: ${id} | Status: ${status}`);
    }
  } else if (messages) {
    const waId = value?.contacts?.[0]?.wa_id;
    for (const message of messages) {
      if (message.type === 'text') {
        console.log(`From (wa_id): ${waId} | Message ID: ${message.id} | Text: ${message.text.body}`);
      }
    }
  } else {
    console.log('Other Webhooks');
    console.log(JSON.stringify(req.body, null, 2));
  }
  res.status(200).end();
});
// Route to get the amount of miles a member has
app.get('/miles/:memberId', (req, res) => {
  console.log("Miles Connector called");
  const { memberId } = req.params;
  const normalizedId = memberId.trim();
  console.log("Enquiring member: " + normalizedId);
  const miles = memberMiles[normalizedId];
  if (miles === undefined) {
    console.log("Member not found");
    return res.status(404).json({
      error: `No miles found for member "${memberId}"`,
      availableMembers: Object.keys(memberMiles),
    });
  }
  res.status(200).json({ memberId: normalizedId, miles });
});
// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
