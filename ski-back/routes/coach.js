// Coach API routes - handles coach-specific operations
const express = require("express");
const router = express.Router();

// GET /api/coach - Coach dashboard endpoint
router.get("/", (req, res) => {
  res.json({ ok: true, area: "coach" });
});

module.exports = router;
