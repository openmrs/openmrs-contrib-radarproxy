const express = require('express');
const rateLimit = require('express-rate-limit')
const {google} = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// cell containing name of sheet to use
const PUBLISHED_SHEET_NAME_RANGE = process.env.PUBLISHED_SHEET_NAME_RANGE;
// columns needed by radar app
const DATA_RANGE = process.env.DATA_RANGE;
const PORT = process.env.PORT || 3000;
const RATE_LIMIT_WINDOW_MINUTES = process.env.RATE_LIMIT_WINDOW_MINUTES || 15;
const RATE_LIMIT_MAX_REQUESTS_IN_WINDOW = process.env.RATE_LIMIT_MAX_REQUESTS_IN_WINDOW || 100;

const app = express();

// Rate limit requests to prevent abuse
const limiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
	max: RATE_LIMIT_MAX_REQUESTS_IN_WINDOW,
	standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
	legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res, next, options) => res.status(options.statusCode)
    // If 
    .type('application/json')
    .set('Access-Control-Allow-Origin', '*')
    .send('[]'),
});
app.use(limiter);

const auth = new google.auth.GoogleAuth({
  keyFile: './.credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({version: 'v4', auth});

async function getData() {
  const publishedSheetNameRange = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: PUBLISHED_SHEET_NAME_RANGE,
  });
  const publishedSheetName = publishedSheetNameRange.data.values[0][0];
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${publishedSheetName}!${DATA_RANGE}`,
  });
  const header = res.data.values[0]; // first row assumed to be header
  return res.data.values.slice(1) // ignore header line
    .map( row => {
      // For each row, build map with keys from header row
      let obj = {};
      for (var i=0; i<row.length; i++) {
        obj[header[i]] = row[i];
      }
      return obj;
    });
}

// Return 200 OK with empty result at root (can be used as healthcheck)
app.get('/', (req, res) => {
  res.status(200).send('');
});

// Publish data at /openmrs%20radar.json (radar expect .json extension)
app.get('/openmrs%20radar.json', (req, res) => {
  getData()
    .then( data =>
      res
        .status(200)
        .type('application/json')
        .set('Access-Control-Allow-Origin', '*')
        .send(data)
    )
    .catch( err =>
      res
        .status(500)
        .type('application/json')
        .set('Access-Control-Allow-Origin', '*')
        .send(JSON.stringify({ error: err.message }))
    );
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});