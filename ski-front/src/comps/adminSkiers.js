// Admin component for managing skier assignments to teams
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

export default function AdminSkiers() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [skiers, setSkiers] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [skierId, setSkierId] = useState("");
  const [message, setMessage] = useState("");

  // Load teams and skiers data from API
  async function loadData() {
    const [teamsRes, skiersRes] = await Promise.all([
      fetch(`${API_BASE}/teams`),
      fetch(`${API_BASE}/skiers`),
    ]);

    if (teamsRes.ok) setTeams(await teamsRes.json());
    if (skiersRes.ok) setSkiers(await skiersRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle skier assignment to team
  async function handleAssign(event) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(`${API_BASE}/teams/${teamId}/skier`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skier_id: Number(skierId) }),
    });

    if (!response.ok) {
      setMessage("Failed to assign skier");
      return;
    }

    setMessage("Skier assigned");
    setSkierId("");
    setTeamId("");
    loadData();
  }

  // Helper function to get team name by team ID
  function getTeamNameById(id) {
    const team = teams.find((t) => t.team_id === id);
    return team ? team.team_name : "None";
  }

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
          maxWidth: "540px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          borderRadius: "16px",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.24)",
          padding: "32px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: "24px", fontWeight: "700" }}>
          Manage Skiers
        </h1>

        <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>

          <select
            value={skierId}
            onChange={(e) => setSkierId(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Select skier</option>
            {skiers.map((skier) => (
              <option key={skier.user_id} value={skier.user_id}>
                {skier.first_name} {skier.last_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#1976d2",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Assign Skier
          </button>
        </form>

        {message && <p style={{ color: "#1976d2", marginTop: "18px" }}>{message}</p>}

        <div style={{ overflowX: "auto", marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Skier
                </th>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Team
                </th>
              </tr>
            </thead>
            <tbody>
              {skiers.map((skier) => (
                <tr key={skier.user_id}>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {skier.first_name} {skier.last_name}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {getTeamNameById(skier.team_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => navigate("/admin")}
          style={{
            marginTop: "20px",
            paddingLeft: 0,
            paddingRight: 0,
            alignSelf: "flex-start",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
