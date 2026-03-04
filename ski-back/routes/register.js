const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    console.log("RECV POST REQ IN REGISTER.JS");
    const sql = `
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(sql, [firstName, lastName, email, password, role]);

    res.json({ message: "User registered" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;