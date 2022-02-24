OpenMRS Radar Proxy
===================

Simple proxy for OpenMRS Radar Data, using a service account to reflect
Google Sheet data in the format needed by [thoughtworks/build-your-own-radar](https://github.com/thoughtworks/build-your-own-radar) [OpenMRS Radar](https://om.rs/radar),
allowing OpenMRS Radar to read data from the Google Sheet without having to
bother with authentication details.

Running
-------
1. Create service account, create key in json format, and save key to
`.credentials.json`.

2. Copy `sample.env` to `.env` and set spreadsheet ID.

3. `docker compose up -d`