// Skier API routes - handles skier-specific operations
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/skier - Skier dashboard endpoint
router.get("/", (req, res) => {
  res.json({ ok: true, area: "skier" });
});

router.get("/:userId/results", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "Valid userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
              rr.time_seconds, c.course_name,
              GROUP_CONCAT(t.team_name ORDER BY rt.position SEPARATOR '||') AS team_names_csv
       FROM race_results rr
       JOIN races r ON r.race_id = rr.race_id
       JOIN courses c ON c.course_id = r.course_id
       JOIN race_teams rt ON rt.race_id = r.race_id
       JOIN teams t ON t.team_id = rt.team_id
       WHERE rr.user_id = ?
       GROUP BY r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
                rr.time_seconds, c.course_name
       ORDER BY r.race_date, r.start_time`,
      [userId]
    );

    return res.json({
      ok: true,
      results: rows.map((row) => ({
        ...row,
        team_names: row.team_names_csv ? row.team_names_csv.split("||") : [],
        team_names_csv: undefined,
      })),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not load skier results" });
  }
});

module.exports = router;
