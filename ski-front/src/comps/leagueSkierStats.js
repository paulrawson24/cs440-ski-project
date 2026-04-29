import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

export default function LeagueSkierStats() {
  const navigate = useNavigate();
  const [skiers, setSkiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/reports/skier-stats`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load skier stats report");
        }

        setSkiers(data.skiers || []);
      } catch (err) {
        setError(err.message || "Failed to load skier stats report");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url('https://cdn.wallpapersafari.com/37/68/5vCXUx.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          borderRadius: "16px",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.24)",
          padding: "32px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <h1 style={{ margin: 0, fontWeight: "700" }}>Skier Stats</h1>

          <button
            onClick={() => navigate("/league-stats")}
            style={{
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            Back
          </button>
        </div>

        {loading ? (
          <p style={{ margin: 0, color: "#555" }}>Loading skier stats...</p>
        ) : null}

        {!loading && error ? (
          <p style={{ margin: 0, color: "#c62828" }}>{error}</p>
        ) : null}

        {!loading && !error && skiers.length === 0 ? (
          <p style={{ margin: 0, color: "#555" }}>No completed race results available yet.</p>
        ) : null}

        {!loading && !error && skiers.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Rank
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Skier
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Team
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Completed Races
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Total Time
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Average Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {skiers.map((skier) => (
                  <tr key={skier.user_id}>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #eee", fontWeight: 700 }}>
                      #{skier.rank}
                    </td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #eee" }}>
                      {skier.first_name} {skier.last_name}
                    </td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #eee" }}>
                      {skier.team_name}
                    </td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #eee" }}>
                      {skier.race_count}
                    </td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #eee" }}>
                      {skier.total_time}s
                    </td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #eee" }}>
                      {skier.average_time}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
