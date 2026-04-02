// Teams API routes - handles team-related operations
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/teams - Retrieve all teams
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT team_id, team_name, coach_id FROM teams"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load teams" });
  }
});

module.exports = router;
