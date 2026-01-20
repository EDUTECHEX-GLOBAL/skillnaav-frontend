// services/university.service.js
const axios = require("axios");

const BASE_URL = "http://universities.hipolabs.com/search";

exports.searchUniversities = async ({ country, query }) => {
  const res = await axios.get(BASE_URL, {
    params: {
      country,
      name: query,
    },
    timeout: 5000,
  });

  return res.data.map((u) => ({
    name: u.name,
    country: u.country,
    state: u["state-province"],
    website: u.web_pages?.[0],
  }));
};
