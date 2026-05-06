const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
              r.course_id, r.status,
              GROUP_CONCAT(t.team_id ORDER BY rt.position) AS team_ids_csv,
              GROUP_CONCAT(t.team_name ORDER BY rt.position SEPARATOR '||') AS team_names_csv
       FROM races r
       JOIN race_teams rt ON rt.race_id = r.race_id
       JOIN teams t ON t.team_id = rt.team_id
       GROUP BY r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
                r.course_id, r.status`
    );
    res.json(rows.map((row) => {
      const teamIds = row.team_ids_csv.split(",").map(Number);
      const teamNames = row.team_names_csv.split("||");
      return {
        ...row,
        team_ids: teamIds,
        team_names: teamNames,
        team1_id: teamIds[0] ?? null,
        team2_id: teamIds[1] ?? null,
        team1_name: teamNames[0] ?? null,
        team2_name: teamNames[1] ?? null,
        team_ids_csv: undefined,
        team_names_csv: undefined,
      };
    }));
  } catch (err) {
    res.status(500).json({ error: "Failed to load races" });
  }
});

module.exports = router;
