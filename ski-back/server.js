// ski-back/server.js

console.log("Starting server...");

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const coachRoutes = require("./routes/coach");
const skierRoutes = require("./routes/skier");
const registerRoute = require("./routes/register");
const teamsRoutes = require("./routes/teams");
const racesRoutes = require("./routes/races");



console.log("authRoutes type:", typeof authRoutes);
console.log("adminRoutes type:", typeof adminRoutes);
console.log("coachRoutes type:", typeof coachRoutes);
console.log("skierRoutes type:", typeof skierRoutes);
console.log("registerRoutes type:", typeof registerRoute);
console.log("teamsRoutes type:", typeof teamsRoutes);
console.log("racesRoutes type:", typeof racesRoutes);


const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/skier", skierRoutes);
app.use("/api/register", registerRoute);
app.use("/api/teams", teamsRoutes);
app.use("/api/races", racesRoutes);


const PORT = 4000;
app.listen(PORT, () => console.log(`API running on ${PORT}`));


const pool = require("./db");

// test database connection
async function testDB() {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    console.log("DB connection working!");
    console.log(rows);
  } catch (err) {
    console.error("DB connection failed:", err);
  }
}

testDB();