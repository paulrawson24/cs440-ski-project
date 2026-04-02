// Main Express server file for the ski league backend API

console.log("Starting server...");

const express = require("express");
const cors = require("cors");

// Import all route modules for different user roles and functionalities
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const coachRoutes = require("./routes/coach");
const skierRoutes = require("./routes/skier");
const registerRoute = require("./routes/register");
const teamsRoutes = require("./routes/teams");
const racesRoutes = require("./routes/races");

// Debug logging to verify route modules are loaded correctly
console.log("authRoutes type:", typeof authRoutes);
console.log("adminRoutes type:", typeof adminRoutes);
console.log("coachRoutes type:", typeof coachRoutes);
console.log("skierRoutes type:", typeof skierRoutes);
console.log("registerRoutes type:", typeof registerRoute);
console.log("teamsRoutes type:", typeof teamsRoutes);
console.log("racesRoutes type:", typeof racesRoutes);

// Initialize Express application
const app = express();
// Enable CORS for cross-origin requests from frontend
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// Health check endpoint for monitoring
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Mount all API route handlers under their respective paths
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/skier", skierRoutes);
app.use("/api/register", registerRoute);
app.use("/api/teams", teamsRoutes);
app.use("/api/races", racesRoutes);

// Start the server on port 4000
const PORT = 4000;
app.listen(PORT, () => console.log(`API running on ${PORT}`));

// Import database connection pool
const pool = require("./db");

// Test database connection on startup
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