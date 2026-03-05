const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const sql = `
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [firstName, lastName, email, password, role]);

    res.status(201).json({ ok: true, message: "User registered" });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
