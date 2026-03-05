const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT user_id, first_name, last_name, email, role, team_id FROM users WHERE email = ? AND password = ? LIMIT 1",
      [email, password]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
