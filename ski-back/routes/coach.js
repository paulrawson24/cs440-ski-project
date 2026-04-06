// Coach API routes - handles coach-specific operations
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/coach - Coach dashboard endpoint
router.get("/", (req, res) => {
  res.json({ ok: true, area: "coach" });
});

router.get("/:coachId/team-results", async (req, res) => {
  const coachId = Number(req.params.coachId);
  if (!coachId) {
    return res.status(400).json({ ok: false, error: "Valid coachId is required" });
  }

  try {
    const [[coach]] = await pool.query(
      `SELECT user_id, team_id
       FROM users
       WHERE user_id = ? AND role = 'coach'`,
      [coachId]
    );

    if (!coach || !coach.team_id) {
      return res.status(404).json({ ok: false, error: "Coach team not found" });
    }

    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name,
              r.race_id, r.race_name, r.race_date, r.start_time,
              rr.time_seconds
       FROM users u
       LEFT JOIN race_results rr ON rr.user_id = u.user_id
       LEFT JOIN races r ON r.race_id = rr.race_id
       WHERE u.role = 'skier' AND u.team_id = ?
       ORDER BY u.last_name, u.first_name, r.race_date, r.start_time`,
      [coach.team_id]
    );

    return res.json({ ok: true, results: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not load team results" });
  }
});

module.exports = router;
