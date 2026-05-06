// Authentication routes for user login
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");

// POST /api/auth/login - Authenticate user credentials
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Query database for user with matching email and password
    const [rows] = await pool.query(
      "SELECT user_id, first_name, last_name, email, role, team_id, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

  const { password_hash, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
