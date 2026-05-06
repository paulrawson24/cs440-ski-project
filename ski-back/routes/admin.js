const express = require("express");
const router = express.Router();
const pool = require("../db");

function parseRaceDateTime(dateStr, timeStr) {
  const value = new Date(`${dateStr}T${timeStr}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getRaceResult(teamTime, opponentTime) {
  if (teamTime < opponentTime) return "win";
  if (teamTime > opponentTime) return "loss";
  return "tie";
}

function normalizeTeamIds(body) {
  const rawIds = Array.isArray(body.team_ids)
    ? body.team_ids
    : [body.team1_id, body.team2_id];

  return [...new Set(rawIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

function placeholders(values) {
  return values.map(() => "?").join(", ");
}

function hydrateRaceTeams(row) {
  const teamIds = row.team_ids_csv
    ? row.team_ids_csv.split(",").map(Number)
    : [];
  const teamNames = row.team_names_csv
    ? row.team_names_csv.split("||")
    : [];

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
                FROM race_teams rt
                WHERE rt.team_id = t.team_id
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
  const { race_name, race_date, start_time, end_time, course_id } = req.body;
  const teamIds = normalizeTeamIds(req.body);

  if (!race_name || !race_date || !start_time || !end_time || !course_id || teamIds.length < 2) {
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

    if (raceStart >= raceEnd) {
      return res.status(400).json({ ok: false, error: "Race end time must be after the start time" });
    }

    if (raceStart <= new Date()) {
      return res.status(400).json({ ok: false, error: "Race must be scheduled for a future date and time" });
    }

    // Check if either team already has a race scheduled at the same time/date
    const [teamConflicts] = await pool.query(
      `SELECT DISTINCT r.race_id
       FROM races r
       JOIN race_teams rt ON rt.race_id = r.race_id
       WHERE r.race_date = ?
         AND r.status <> 'canceled'
         AND rt.team_id IN (${placeholders(teamIds)})
         AND NOT (r.end_time <= ? OR r.start_time >= ?)`,
      [race_date, ...teamIds, start_time, end_time]
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

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO races (race_name, race_date, start_time, end_time, course_id)
         VALUES (?, ?, ?, ?, ?)`,
        [race_name, race_date, start_time, end_time, course_id]
      );

      const raceId = result.insertId;
      const raceTeamValues = teamIds.map((teamId, index) => [raceId, teamId, index + 1]);
      await connection.query(
        "INSERT INTO race_teams (race_id, team_id, position) VALUES ?",
        [raceTeamValues]
      );
      await connection.commit();
      return res.status(201).json({ ok: true, race_id: raceId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not create race" });
  }
});

router.get("/races", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
              r.course_id, r.status, c.course_name,
              GROUP_CONCAT(t.team_id ORDER BY rt.position) AS team_ids_csv,
              GROUP_CONCAT(t.team_name ORDER BY rt.position SEPARATOR '||') AS team_names_csv
       FROM races r
       JOIN courses c ON c.course_id = r.course_id
       JOIN race_teams rt ON rt.race_id = r.race_id
       JOIN teams t ON t.team_id = rt.team_id
       GROUP BY r.race_id, r.race_name, r.race_date, r.start_time, r.end_time,
                r.course_id, r.status, c.course_name
       ORDER BY r.race_date, r.start_time`
    );
    return res.json(rows.map(hydrateRaceTeams));
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
      `SELECT r.race_id, r.race_name, r.status,
              GROUP_CONCAT(t.team_id ORDER BY rt.position) AS team_ids_csv,
              GROUP_CONCAT(t.team_name ORDER BY rt.position SEPARATOR '||') AS team_names_csv
       FROM races r
       JOIN race_teams rt ON rt.race_id = r.race_id
       JOIN teams t ON t.team_id = rt.team_id
       WHERE r.race_id = ?
       GROUP BY r.race_id, r.race_name, r.status`,
      [raceId]
    );

    if (!race) {
      return res.status(404).json({ ok: false, error: "Race not found" });
    }

    const hydratedRace = hydrateRaceTeams(race);
    const [skiers] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.team_id, rr.time_seconds
       FROM users u
       LEFT JOIN race_results rr
         ON rr.user_id = u.user_id AND rr.race_id = ?
       WHERE u.role = 'skier'
         AND u.team_id IN (${placeholders(hydratedRace.team_ids)})
       ORDER BY u.team_id, u.last_name, u.first_name`,
      [raceId, ...hydratedRace.team_ids]
    );

    return res.json({ ok: true, race: hydratedRace, skiers });
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
      `SELECT r.race_id,
              GROUP_CONCAT(rt.team_id ORDER BY rt.position) AS team_ids_csv
       FROM races r
       JOIN race_teams rt ON rt.race_id = r.race_id
       WHERE r.race_id = ?
       GROUP BY r.race_id`,
      [raceId]
    );

    if (!race) {
      return res.status(404).json({ ok: false, error: "Race not found" });
    }

    const teamIds = race.team_ids_csv.split(",").map(Number);
    const [allowedSkiers] = await pool.query(
      `SELECT user_id
       FROM users
       WHERE role = 'skier'
         AND team_id IN (${placeholders(teamIds)})`,
      teamIds
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

router.get("/reports/team-stats", async (_req, res) => {
  try {
    const completedRaceSubquery = `
      SELECT completed.race_id
      FROM (
        SELECT rt.race_id, rt.team_id, COUNT(rr.user_id) AS result_count
        FROM race_teams rt
        JOIN races r ON r.race_id = rt.race_id
        LEFT JOIN users u ON u.team_id = rt.team_id AND u.role = 'skier'
        LEFT JOIN race_results rr ON rr.race_id = rt.race_id AND rr.user_id = u.user_id
        WHERE r.status <> 'canceled'
        GROUP BY rt.race_id, rt.team_id
        HAVING result_count = 2
      ) completed
      GROUP BY completed.race_id
      HAVING COUNT(*) = (
        SELECT COUNT(*)
        FROM race_teams rt_count
        WHERE rt_count.race_id = completed.race_id
      )
    `;

    const [rows] = await pool.query(
      `SELECT r.race_id, r.race_name, r.race_date, c.course_name,
              rt.team_id, t.team_name, SUM(rr.time_seconds) AS team_time,
              COUNT(rr.user_id) AS result_count, MIN(rt.position) AS participant_position
       FROM races r
       JOIN courses c ON c.course_id = r.course_id
       JOIN race_teams rt ON rt.race_id = r.race_id
       JOIN teams t ON t.team_id = rt.team_id
       JOIN race_results rr ON rr.race_id = r.race_id
       JOIN users u ON u.user_id = rr.user_id AND u.team_id = rt.team_id
       WHERE r.status <> 'canceled'
         AND r.race_id IN (${completedRaceSubquery})
       GROUP BY r.race_id, r.race_name, r.race_date, c.course_name,
                rt.team_id, t.team_name
       ORDER BY r.race_date, r.race_id, participant_position`
    );

    const [teamRows] = await pool.query(
      `SELECT t.team_id, t.team_name,
              coach.first_name AS coach_first_name,
              coach.last_name AS coach_last_name,
              skier.user_id AS skier_user_id,
              skier.first_name AS skier_first_name,
              skier.last_name AS skier_last_name
       FROM teams t
       LEFT JOIN users coach
         ON coach.user_id = t.coach_id
       LEFT JOIN users skier
         ON skier.team_id = t.team_id AND skier.role = 'skier'
       ORDER BY t.team_name, skier.last_name, skier.first_name`
    );

    const [skierStatRows] = await pool.query(
      `SELECT u.user_id, u.team_id,
              COUNT(rr.race_id) AS race_count,
              SUM(rr.time_seconds) AS total_time,
              ROUND(AVG(rr.time_seconds), 2) AS average_time
       FROM users u
       JOIN race_results rr ON rr.user_id = u.user_id
       JOIN races r ON r.race_id = rr.race_id
       WHERE u.role = 'skier'
         AND r.race_id IN (${completedRaceSubquery})
       GROUP BY u.user_id, u.team_id`
    );

    const teamMap = new Map();
    const skierStatsMap = new Map(
      skierStatRows.map((row) => [
        Number(row.user_id),
        {
          race_count: Number(row.race_count),
          total_time: Number(row.total_time),
          average_time: Number(row.average_time),
        },
      ])
    );

    function ensureTeam(teamId, teamName, coachName = "Unassigned") {
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          team_id: teamId,
          team_name: teamName,
          coach_name: coachName,
          wins: 0,
          losses: 0,
          ties: 0,
          avg_team_time: null,
          completed_races: 0,
          team_time_total: 0,
          skiers: [],
          races: [],
        });
      }

      return teamMap.get(teamId);
    }

    for (const row of teamRows) {
      const teamId = Number(row.team_id);
      const coachName = row.coach_first_name && row.coach_last_name
        ? `${row.coach_first_name} ${row.coach_last_name}`
        : "Unassigned";
      const team = ensureTeam(teamId, row.team_name, coachName);

      if (Number(row.skier_user_id)) {
        const skierId = Number(row.skier_user_id);
        const alreadyIncluded = team.skiers.some((skier) => skier.user_id === skierId);

        if (!alreadyIncluded) {
          const skierStats = skierStatsMap.get(skierId);
          team.skiers.push({
            user_id: skierId,
            first_name: row.skier_first_name,
            last_name: row.skier_last_name,
            race_count: skierStats?.race_count ?? 0,
            total_time: skierStats?.total_time ?? null,
            average_time: skierStats?.average_time ?? null,
          });
        }
      }
    }

    const raceMap = new Map();
    for (const row of rows) {
      if (!raceMap.has(row.race_id)) raceMap.set(row.race_id, []);
      raceMap.get(row.race_id).push(row);
    }

    for (const raceTeams of raceMap.values()) {
      const bestTime = Math.min(...raceTeams.map((row) => Number(row.team_time)));

      for (const row of raceTeams) {
        const teamTime = Number(row.team_time);
        const result = teamTime === bestTime
          ? raceTeams.filter((other) => Number(other.team_time) === bestTime).length > 1 ? "tie" : "win"
          : "loss";
        const team = ensureTeam(Number(row.team_id), row.team_name);
        const opponents = raceTeams
          .filter((other) => Number(other.team_id) !== Number(row.team_id))
          .map((other) => other.team_name)
          .join(", ");

        team.races.push({
          race_id: row.race_id,
          race_name: row.race_name,
          race_date: row.race_date,
          course_name: row.course_name,
          opponent_name: opponents,
          team_time: teamTime,
          opponent_time: bestTime,
          result,
        });

        team.completed_races += 1;
        team.team_time_total += teamTime;

        if (result === "win") team.wins += 1;
        else if (result === "loss") team.losses += 1;
        else team.ties += 1;
      }
    }

    const teams = Array.from(teamMap.values())
      .map((team) => ({
        ...team,
        avg_team_time: team.completed_races > 0
          ? Number((team.team_time_total / team.completed_races).toFixed(2))
          : null,
        skiers: team.skiers.sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
        ),
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        if (b.ties !== a.ties) return b.ties - a.ties;
        if (a.avg_team_time === null && b.avg_team_time !== null) return 1;
        if (a.avg_team_time !== null && b.avg_team_time === null) return -1;
        if (a.avg_team_time !== null && b.avg_team_time !== null && a.avg_team_time !== b.avg_team_time) {
          return a.avg_team_time - b.avg_team_time;
        }
        return a.team_name.localeCompare(b.team_name);
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    return res.json({ ok: true, teams });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not load team stats report" });
  }
});

router.get("/reports/skier-stats", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.team_id, t.team_name,
              COUNT(rr.race_id) AS race_count,
              SUM(rr.time_seconds) AS total_time,
              ROUND(AVG(rr.time_seconds), 2) AS average_time
       FROM users u
       JOIN teams t ON t.team_id = u.team_id
       JOIN race_results rr ON rr.user_id = u.user_id
       JOIN races r ON r.race_id = rr.race_id
       WHERE u.role = 'skier'
         AND r.race_id IN (
           SELECT complete_races.race_id
           FROM (
             SELECT completed.race_id
             FROM (
               SELECT rt.race_id, rt.team_id, COUNT(rr2.user_id) AS result_count
               FROM race_teams rt
               JOIN races r2 ON r2.race_id = rt.race_id
               LEFT JOIN users u2 ON u2.team_id = rt.team_id AND u2.role = 'skier'
               LEFT JOIN race_results rr2 ON rr2.race_id = rt.race_id AND rr2.user_id = u2.user_id
               WHERE r2.status <> 'canceled'
               GROUP BY rt.race_id, rt.team_id
               HAVING result_count = 2
             ) AS completed
             GROUP BY completed.race_id
             HAVING COUNT(*) = (
               SELECT COUNT(*)
               FROM race_teams rt_count
               WHERE rt_count.race_id = completed.race_id
             )
           ) AS complete_races
         )
       GROUP BY u.user_id, u.first_name, u.last_name, u.team_id, t.team_name
       ORDER BY average_time ASC, total_time ASC, u.last_name ASC, u.first_name ASC`
    );

    const skiers = rows.map((row, index) => ({
      rank: index + 1,
      user_id: row.user_id,
      first_name: row.first_name,
      last_name: row.last_name,
      team_id: row.team_id,
      team_name: row.team_name,
      race_count: Number(row.race_count),
      total_time: Number(row.total_time),
      average_time: Number(row.average_time),
    }));

    return res.json({ ok: true, skiers });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Could not load skier stats report" });
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
                FROM race_teams rt
                WHERE rt.team_id = t.team_id
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
