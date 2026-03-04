const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
