// Authentication routes for user login
const express = require("express");
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
      "SELECT user_id, first_name, last_name, email, role, team_id FROM users WHERE email = ? AND password = ? LIMIT 1",
      [email, password]
    );

    // Check if user was found
    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user data (excluding password for security)
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
