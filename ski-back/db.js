// Author: Paul Rawson

// ski-back/db.js
// connect to our shared db on openstack

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "138.49.184.87",
  user: "cs440",
  password: "password",
  database: "ski_league",
});

module.exports = pool;
