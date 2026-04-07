// Skier API routes - handles skier-specific operations
const express = require("express");
const router = express.Router();

// GET /api/skier - Skier dashboard endpoint
router.get("/", (req, res) => {
  res.json({ ok: true, area: "skier" });
});

module.exports = router;
