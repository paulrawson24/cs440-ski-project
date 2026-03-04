const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ ok: true, area: "admin" });
});

module.exports = router;
