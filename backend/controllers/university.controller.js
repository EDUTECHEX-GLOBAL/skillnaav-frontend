const { searchUniversities } = require("../services/university.service");

exports.getUniversities = async (req, res) => {
  try {
    const { country, query } = req.query;

    // Hard validation
    if (!country || !query || query.trim().length < 2) {
      return res.json([]);
    }

    // Only allow US & Canada
    if (!["United States", "Canada"].includes(country)) {
      return res.status(400).json({ message: "Invalid country" });
    }

    const universities = await searchUniversities({
      country,
      query: query.trim(),
    });

    res.json(universities.slice(0, 10)); // limit results
  } catch (error) {
    console.error("University fetch error:", error.message);
    res.status(500).json({ message: "Failed to fetch universities" });
  }
};
