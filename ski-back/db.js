// Database connection configuration for the ski league application
// Author: Paul Rawson

// ski-back/db.js
// connect to our shared db on openstack

const mysql = require("mysql2/promise");

// Create a connection pool for efficient database connections
// Pool allows multiple concurrent connections and automatic connection management
const pool = mysql.createPool({
  host: "138.49.184.87",
  user: "cs440",
  password: "password",
  database: "ski_league",
});

module.exports = pool;
