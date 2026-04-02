const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", (req, res) => {
  res.json({ ok: true, area: "admin" });
});

router.post("/teams", async (req, res) => {
  const { team_name } = req.body;
  if (!team_name) {
    return res.status(400).json({ ok: false, error: "team_name is required" });
  }

  try {
    const [result] = await pool.query("INSERT INTO teams (team_name) VALUES (?)", [team_name]);
    return res.status(201).json({ ok: true, team_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not create team" });
  }
});

router.get("/teams", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.team_id, t.team_name, t.coach_id,
              u.first_name AS coach_first_name, u.last_name AS coach_last_name
       FROM teams t
       LEFT JOIN users u ON u.user_id = t.coach_id
       ORDER BY t.team_id`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not fetch teams" });
  }
});

router.post("/courses", async (req, res) => {
  const { course_name } = req.body;
  if (!course_name) {
    return res.status(400).json({ ok: false, error: "course_name is required" });
  }

  try {
    const [result] = await pool.query("INSERT INTO courses (course_name) VALUES (?)", [course_name]);
    return res.status(201).json({ ok: true, course_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not create course" });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT course_id, course_name FROM courses ORDER BY course_id");
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not fetch courses" });
  }
});

// POST /api/admin/races - Create a new race with conflict validation
router.post("/races", async (req, res) => {
  const { race_name, race_date, start_time, end_time, course_id, team1_id, team2_id } = req.body;
  if (!race_name || !race_date || !start_time || !end_time || !course_id || !team1_id || !team2_id) {
    return res.status(400).json({ ok: false, error: "Missing race fields" });
  }

  try {
    // Check if either team already has a race scheduled at the same time/date
    const [teamConflicts] = await pool.query(
      `SELECT race_id FROM races 
       WHERE race_date = ? 
       AND ((team1_id = ? OR team2_id = ?) OR (team1_id = ? OR team2_id = ?))
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [race_date, team1_id, team1_id, team2_id, team2_id, start_time, end_time]
    );

    if (teamConflicts.length > 0) {
      return res.status(400).json({ ok: false, error: "Failed to create race" });
    }

    // Check if the course already has a race scheduled at the same time/date
    const [courseConflicts] = await pool.query(
      `SELECT race_id FROM races 
       WHERE course_id = ? 
       AND race_date = ? 
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [course_id, race_date, start_time, end_time]
    );

    if (courseConflicts.length > 0) {
      return res.status(400).json({ ok: false, error: "Failed to create race" });
    }

    const [result] = await pool.query(
      `INSERT INTO races (race_name, race_date, start_time, end_time, course_id, team1_id, team2_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [race_name, race_date, start_time, end_time, course_id, team1_id, team2_id]
    );
    return res.status(201).json({ ok: true, race_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not create race" });
  }
});

router.get("/races", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
              r.course_id, c.course_name, r.team1_id, t1.team_name AS team1_name,
              r.team2_id, t2.team_name AS team2_name
       FROM races r
       JOIN courses c ON c.course_id = r.course_id
       JOIN teams t1 ON t1.team_id = r.team1_id
       JOIN teams t2 ON t2.team_id = r.team2_id
       ORDER BY r.race_date, r.start_time`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not fetch races" });
  }
});

router.get("/coaches", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, first_name, last_name, email, team_id
       FROM users
       WHERE role = 'coach'
       ORDER BY user_id`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not fetch coaches" });
  }
});

router.get("/skiers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, first_name, last_name, email, team_id
       FROM users
       WHERE role = 'skier'
       ORDER BY user_id`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not fetch skiers" });
  }
});

router.put("/teams/:teamId/coach", async (req, res) => {
  const teamId = Number(req.params.teamId);
  const { coach_id } = req.body;
  if (!teamId || !coach_id) {
    return res.status(400).json({ ok: false, error: "teamId and coach_id are required" });
  }

  try {
    await pool.query("UPDATE teams SET coach_id = ? WHERE team_id = ?", [coach_id, teamId]);
    await pool.query("UPDATE users SET team_id = ? WHERE user_id = ? AND role = 'coach'", [teamId, coach_id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not assign coach" });
  }
});

router.put("/teams/:teamId/skier", async (req, res) => {
  const teamId = Number(req.params.teamId);
  const { skier_id } = req.body;
  if (!teamId || !skier_id) {
    return res.status(400).json({ ok: false, error: "teamId and skier_id are required" });
  }

  try {
    await pool.query("UPDATE users SET team_id = ? WHERE user_id = ? AND role = 'skier'", [teamId, skier_id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not assign skier" });
  }
});

module.exports = router;
