const axios = require("axios");

const GEODB_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";

const searchCities = async ({ country, query }) => {
  const countryIds = country === "Canada" ? "CA" : "US";

  if (!process.env.GEODB_API_KEY) {
    throw new Error("GEODB_API_KEY is missing");
  }

  const response = await axios.get(GEODB_URL, {
    params: {
      namePrefix: query,
      limit: 10,
      minPopulation: 100000,
      countryIds,
    },
    headers: {
      "X-RapidAPI-Key": process.env.GEODB_API_KEY,
      "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
    },
    timeout: 5000,
  });

  return response.data.data;
};

module.exports = { searchCities };
