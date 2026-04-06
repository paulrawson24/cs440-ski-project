const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT race_id, race_name, race_date, start_time, end_time, course_id, team1_id, team2_id, status FROM races"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load races" });
  }
});

module.exports = router;
