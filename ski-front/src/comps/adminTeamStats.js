import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

function getHomePath() {
  const stored = localStorage.getItem("user");

  if (!stored) return "/";

  try {
    const parsed = JSON.parse(stored);
    if (parsed.role === "admin") return "/admin";
    if (parsed.role === "coach") return "/coach";
    if (parsed.role === "skier") return "/skier";
  } catch {
    return "/";
  }

  return "/";
}

export default function AdminTeamStats() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/reports/team-stats`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load team stats report");
        }

        setTeams(data.teams || []);
      } catch (err) {
        setError(err.message || "Failed to load team stats report");
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
          <h1 style={{ margin: 0, fontWeight: "700" }}>
            League Stats
          </h1>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/league-stats/skiers")}
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
              Skier Rankings
            </button>
            <button
              onClick={() => navigate(getHomePath())}
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
        </div>

        {loading ? (
          <p style={{ margin: 0, color: "#555" }}>Loading team stats...</p>
        ) : null}

        {!loading && error ? (
          <p style={{ margin: 0, color: "#c62828" }}>{error}</p>
        ) : null}

        {!loading && !error && teams.length === 0 ? (
          <p style={{ margin: 0, color: "#555" }}>No completed race results available yet.</p>
        ) : null}

        {!loading && !error && teams.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1080px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Rank
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Team
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Coach
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Skiers
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Record
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Wins
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Losses
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Ties
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Completed Races
                  </th>
                  <th style={{ textAlign: "left", padding: "12px 10px", borderBottom: "2px solid #e0e0e0" }}>
                    Avg Team Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.team_id}>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", fontWeight: 700 }}>
                      #{team.rank}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", fontWeight: 700 }}>
                      {team.team_name}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.coach_name}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.skiers.length === 0 ? (
                        <span style={{ color: "#777" }}>No skiers assigned</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {team.skiers.map((skier) => (
                            <div key={skier.user_id}>
                              <div style={{ fontWeight: 600 }}>
                                {skier.first_name} {skier.last_name}
                              </div>
                              <div style={{ color: "#555", fontSize: "14px" }}>
                                Races: {skier.race_count} | Total: {skier.total_time ?? "-"}{skier.total_time !== null ? "s" : ""} | Avg: {skier.average_time ?? "-"}{skier.average_time !== null ? "s" : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee", fontWeight: 600 }}>
                      {team.wins}-{team.losses}-{team.ties}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.wins}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.losses}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.ties}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.completed_races}
                    </td>
                    <td style={{ padding: "14px 10px", borderBottom: "1px solid #eee" }}>
                      {team.avg_team_time !== null ? `${team.avg_team_time}s` : "-"}
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
