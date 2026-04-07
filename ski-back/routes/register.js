// User registration routes
const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST /api/register - Create a new user account
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate all required fields are provided
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Insert new user into database
    const sql = `
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [firstName, lastName, email, password, role]);

    res.status(201).json({ ok: true, message: "User registered" });

  } catch (err) {
    // Handle duplicate email error specifically
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
