const express = require("express");
const router = express.Router();
const pool = require("../db");

function parseRaceDateTime(dateStr, timeStr) {
  const value = new Date(`${dateStr}T${timeStr}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

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
              u.first_name AS coach_first_name, u.last_name AS coach_last_name,
              (
                SELECT COUNT(*)
                FROM users members
                WHERE members.team_id = t.team_id
              ) AS member_count,
              (
                SELECT COUNT(*)
                FROM races r
                WHERE r.team1_id = t.team_id OR r.team2_id = t.team_id
              ) AS race_count
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
    const [rows] = await pool.query(
      `SELECT c.course_id, c.course_name,
              (
                SELECT COUNT(*)
                FROM races r
                WHERE r.course_id = c.course_id
              ) AS race_count
       FROM courses c
       ORDER BY c.course_id`
    );
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
    const raceStart = parseRaceDateTime(race_date, start_time);
    const raceEnd = parseRaceDateTime(race_date, end_time);
    const raceDay = new Date(`${race_date}T00:00:00`);
    const month = raceDay.getMonth() + 1;
    const year = raceDay.getFullYear();

    if (!raceStart || !raceEnd || Number.isNaN(raceDay.getTime())) {
      return res.status(400).json({ ok: false, error: "Enter a valid race date and time" });
    }

    if (year !== 2026 || month < 2 || month > 5) {
      return res.status(400).json({ ok: false, error: "Race date must be between February 1, 2026 and May 31, 2026" });
    }

    if (Number(team1_id) === Number(team2_id)) {
      return res.status(400).json({ ok: false, error: "Choose two different teams" });
    }

    if (raceStart >= raceEnd) {
      return res.status(400).json({ ok: false, error: "Race end time must be after the start time" });
    }

    if (raceStart <= new Date()) {
      return res.status(400).json({ ok: false, error: "Race must be scheduled for a future date and time" });
    }

    // Check if either team already has a race scheduled at the same time/date
    const [teamConflicts] = await pool.query(
      `SELECT race_id FROM races 
       WHERE race_date = ? 
       AND status <> 'canceled'
       AND ((team1_id = ? OR team2_id = ?) OR (team1_id = ? OR team2_id = ?))
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [race_date, team1_id, team1_id, team2_id, team2_id, start_time, end_time]
    );

    if (teamConflicts.length > 0) {
      return res.status(400).json({ ok: false, error: "One of those teams already has a race during that time" });
    }

    // Check if the course already has a race scheduled at the same time/date
    const [courseConflicts] = await pool.query(
      `SELECT race_id FROM races 
       WHERE course_id = ? 
       AND race_date = ? 
       AND status <> 'canceled'
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [course_id, race_date, start_time, end_time]
    );

    if (courseConflicts.length > 0) {
      return res.status(400).json({ ok: false, error: "That course already has a race scheduled during that time" });
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
              r.course_id, r.status, c.course_name, r.team1_id, t1.team_name AS team1_name,
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

router.get("/races/:raceId/results", async (req, res) => {
  const raceId = Number(req.params.raceId);
  if (!raceId) {
    return res.status(400).json({ ok: false, error: "Valid raceId is required" });
  }

  try {
    const [[race]] = await pool.query(
      `SELECT r.race_id, r.race_name, r.team1_id, r.team2_id, r.status,
              t1.team_name AS team1_name, t2.team_name AS team2_name
       FROM races r
       JOIN teams t1 ON t1.team_id = r.team1_id
       JOIN teams t2 ON t2.team_id = r.team2_id
       WHERE r.race_id = ?`,
      [raceId]
    );

    if (!race) {
      return res.status(404).json({ ok: false, error: "Race not found" });
    }

    const [skiers] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.team_id, rr.time_seconds
       FROM users u
       LEFT JOIN race_results rr
         ON rr.user_id = u.user_id AND rr.race_id = ?
       WHERE u.role = 'skier'
         AND (u.team_id = ? OR u.team_id = ?)
       ORDER BY u.team_id, u.last_name, u.first_name`,
      [raceId, race.team1_id, race.team2_id]
    );

    return res.json({ ok: true, race, skiers });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not load race results" });
  }
});

router.put("/races/:raceId/cancel", async (req, res) => {
  const raceId = Number(req.params.raceId);
  if (!raceId) {
    return res.status(400).json({ ok: false, error: "Valid raceId is required" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE races
       SET status = 'canceled'
       WHERE race_id = ? AND status <> 'canceled'`,
      [raceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Race not found or already canceled" });
    }

    return res.json({ ok: true, message: "Race canceled" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not cancel race" });
  }
});

router.delete("/races/:raceId", async (req, res) => {
  const raceId = Number(req.params.raceId);
  if (!raceId) {
    return res.status(400).json({ ok: false, error: "Valid raceId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT race_id, status
       FROM races
       WHERE race_id = ?`,
      [raceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Race not found" });
    }

    if (rows[0].status !== "canceled") {
      return res.status(400).json({ ok: false, error: "Race must be canceled before deleting" });
    }

    await pool.query(
      `DELETE FROM races
       WHERE race_id = ?`,
      [raceId]
    );

    return res.json({ ok: true, message: "Race deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not delete race" });
  }
});

router.post("/races/:raceId/results", async (req, res) => {
  const raceId = Number(req.params.raceId);
  const { results } = req.body;

  if (!raceId || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ ok: false, error: "Valid raceId and results are required" });
  }

  try {
    const [[race]] = await pool.query(
      `SELECT race_id, team1_id, team2_id
       FROM races
       WHERE race_id = ?`,
      [raceId]
    );

    if (!race) {
      return res.status(404).json({ ok: false, error: "Race not found" });
    }

    const [allowedSkiers] = await pool.query(
      `SELECT user_id
       FROM users
       WHERE role = 'skier'
         AND (team_id = ? OR team_id = ?)`,
      [race.team1_id, race.team2_id]
    );

    const allowedIds = new Set(allowedSkiers.map((row) => row.user_id));

    for (const item of results) {
      const userId = Number(item.user_id);
      const timeSeconds = Number(item.time_seconds);

      if (!allowedIds.has(userId)) {
        return res.status(400).json({ ok: false, error: "Invalid skier for this race" });
      }

      if (!Number.isInteger(timeSeconds) || timeSeconds <= 0) {
        return res.status(400).json({ ok: false, error: "Times must be positive whole numbers" });
      }
    }

    for (const item of results) {
      await pool.query(
        `INSERT INTO race_results (race_id, user_id, time_seconds)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE time_seconds = VALUES(time_seconds)`,
        [raceId, Number(item.user_id), Number(item.time_seconds)]
      );
    }

    return res.json({ ok: true, message: "Race results saved" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not save race results" });
  }
});

router.get("/coaches", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.team_id,
              EXISTS(
                SELECT 1
                FROM teams t
                WHERE t.coach_id = u.user_id
              ) AS is_assigned_coach
       FROM users u
       WHERE u.role = 'coach'
       ORDER BY u.user_id`
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

router.put("/skiers/:userId/remove-team", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "Valid skier userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT user_id, team_id
       FROM users
       WHERE user_id = ? AND role = 'skier'`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Skier not found" });
    }

    if (rows[0].team_id === null) {
      return res.status(400).json({ ok: false, error: "Skier is not on a team" });
    }

    await pool.query(
      `UPDATE users
       SET team_id = NULL
       WHERE user_id = ? AND role = 'skier'`,
      [userId]
    );

    return res.json({ ok: true, message: "Skier removed from team" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not remove skier from team" });
  }
});

router.delete("/skiers/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "Valid skier userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT user_id, team_id
       FROM users
       WHERE user_id = ? AND role = 'skier'`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Skier not found" });
    }

    if (rows[0].team_id !== null) {
      return res.status(400).json({ ok: false, error: "Remove skier from team before deleting" });
    }

    await pool.query(
      `DELETE FROM users
       WHERE user_id = ? AND role = 'skier'`,
      [userId]
    );

    return res.json({ ok: true, message: "Skier deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not delete skier" });
  }
});

router.put("/coaches/:userId/remove-team", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "Valid coach userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT user_id, team_id
       FROM users
       WHERE user_id = ? AND role = 'coach'`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Coach not found" });
    }

    if (rows[0].team_id === null) {
      return res.status(400).json({ ok: false, error: "Coach is not on a team" });
    }

    await pool.query(
      `UPDATE teams
       SET coach_id = NULL
       WHERE coach_id = ?`,
      [userId]
    );

    await pool.query(
      `UPDATE users
       SET team_id = NULL
       WHERE user_id = ? AND role = 'coach'`,
      [userId]
    );

    return res.json({ ok: true, message: "Coach removed from team" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not remove coach from team" });
  }
});

router.delete("/coaches/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ ok: false, error: "Valid coach userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.team_id,
              EXISTS(
                SELECT 1
                FROM teams t
                WHERE t.coach_id = u.user_id
              ) AS is_assigned_coach
       FROM users u
       WHERE u.user_id = ? AND u.role = 'coach'`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Coach not found" });
    }

    if (rows[0].team_id !== null || Number(rows[0].is_assigned_coach) === 1) {
      return res.status(400).json({ ok: false, error: "Remove coach from team before deleting" });
    }

    await pool.query(
      `DELETE FROM users
       WHERE user_id = ? AND role = 'coach'`,
      [userId]
    );

    return res.json({ ok: true, message: "Coach deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not delete coach" });
  }
});

router.delete("/courses/:courseId", async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!courseId) {
    return res.status(400).json({ ok: false, error: "Valid courseId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT c.course_id,
              (
                SELECT COUNT(*)
                FROM races r
                WHERE r.course_id = c.course_id
              ) AS race_count
       FROM courses c
       WHERE c.course_id = ?`,
      [courseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Course not found" });
    }

    if (Number(rows[0].race_count) > 0) {
      return res.status(400).json({ ok: false, error: "Course is used by a race and cannot be deleted" });
    }

    await pool.query(
      `DELETE FROM courses
       WHERE course_id = ?`,
      [courseId]
    );

    return res.json({ ok: true, message: "Course deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not delete course" });
  }
});

router.delete("/teams/:teamId", async (req, res) => {
  const teamId = Number(req.params.teamId);
  if (!teamId) {
    return res.status(400).json({ ok: false, error: "Valid teamId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT t.team_id, t.coach_id,
              (
                SELECT COUNT(*)
                FROM users members
                WHERE members.team_id = t.team_id
              ) AS member_count,
              (
                SELECT COUNT(*)
                FROM races r
                WHERE r.team1_id = t.team_id OR r.team2_id = t.team_id
              ) AS race_count
       FROM teams t
       WHERE t.team_id = ?`,
      [teamId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Team not found" });
    }

    if (Number(rows[0].member_count) > 0 || rows[0].coach_id !== null || Number(rows[0].race_count) > 0) {
      return res.status(400).json({ ok: false, error: "Team must be empty and unused before deleting" });
    }

    await pool.query(
      `DELETE FROM teams
       WHERE team_id = ?`,
      [teamId]
    );

    return res.json({ ok: true, message: "Team deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not delete team" });
  }
});

router.put("/teams/:teamId/coach", async (req, res) => {
  const teamId = Number(req.params.teamId);
  const coachId = Number(req.body.coach_id);
  if (!teamId || !coachId) {
    return res.status(400).json({ ok: false, error: "teamId and coach_id are required" });
  }

  try {
    const [teamRows] = await pool.query(
      "SELECT coach_id FROM teams WHERE team_id = ?",
      [teamId]
    );
    if (teamRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Team not found" });
    }

    const [coachRows] = await pool.query(
      "SELECT team_id FROM users WHERE user_id = ? AND role = 'coach'",
      [coachId]
    );
    if (coachRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Coach not found" });
    }

    const existingCoachId = teamRows[0].coach_id;
    const existingTeamId = coachRows[0].team_id;

    const [assignedCoachRows] = await pool.query(
      "SELECT user_id FROM users WHERE role = 'coach' AND team_id = ? AND user_id != ?",
      [teamId, coachId]
    );
    if (assignedCoachRows.length > 0) {
      return res.status(400).json({ ok: false, error: "can not assign coach" });
    }

    if (existingCoachId && Number(existingCoachId) !== coachId) {
      return res.status(400).json({ ok: false, error: "can not assign coach" });
    }

    if (existingTeamId && Number(existingTeamId) !== teamId) {
      return res.status(400).json({ ok: false, error: "can not assign coach" });
    }

    await pool.query("UPDATE teams SET coach_id = ? WHERE team_id = ?", [coachId, teamId]);
    await pool.query("UPDATE users SET team_id = ? WHERE user_id = ? AND role = 'coach'", [teamId, coachId]);
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
    // Ensure the skier exists and is a skier    
    const [[skier]] = await pool.query(
      "SELECT user_id, team_id FROM users WHERE user_id = ? AND role = 'skier'",
      [skier_id]
    );

    if (!skier) {
      return res.status(404).json({ ok: false, error: "Skier not found" });
    }

    // Prevent moving a skier already assigned to a different team
    if (skier.team_id && Number(skier.team_id) !== teamId) {
      return res.status(400).json({ ok: false, error: "Skier already assigned to another team" });
    }

    // Enforce maximum of 2 skiers per team
    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'skier' AND team_id = ?",
      [teamId]
    );

    const skierCount = Number(countRow.count || 0);

    // Allow update if skier already on this team, otherwise require space
    const alreadyOnTeam = skier.team_id && Number(skier.team_id) === teamId;
    if (!alreadyOnTeam && skierCount >= 2) {
      return res.status(400).json({ ok: false, error: "Team already has 2 skiers" });
    }

    await pool.query(
      "UPDATE users SET team_id = ? WHERE user_id = ? AND role = 'skier'",
      [teamId, skier_id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not assign skier" });
  }
});

module.exports = router;
