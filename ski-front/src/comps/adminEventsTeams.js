// Admin component for managing teams
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

export default function AdminEventsTeams() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");

  const isFormValid = teamName !== '';

  // Load teams data from API
  async function loadData() {
    const teamsRes = await fetch(`${API_BASE}/teams`);
    if (teamsRes.ok) setTeams(await teamsRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle team creation
  async function handleCreateTeam(event) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`${API_BASE}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_name: teamName }),
    });
    if (!response.ok) {
      setMessage("Failed to create team");
      return;
    }
    setTeamName("");
    setMessage("Team created");
    loadData();
  }

  async function handleDeleteTeam(teamId) {
    setMessage("");

    const response = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to delete team");
      return;
    }

    setMessage("Team deleted");
    loadData();
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
          Create Team
        </h1>

        <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            required
            type="text"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          <button
            disabled={!isFormValid}
            type="submit"
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: isFormValid ? "#1976d2" : "#a9aeb2",
              color: isFormValid ? "white" : "#343434",
              fontSize: "16px",
              cursor: isFormValid ? "pointer" : "not-allowed",
            }}
          >
            Create Team
          </button>
        </form>

        {message && <p style={{ color: "#1976d2", marginTop: "18px" }}>{message}</p>}

        <div style={{ overflowX: "auto", marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Team
                </th>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Status
                </th>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.team_id}>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {team.team_name}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {Number(team.member_count) === 0 && !team.coach_id && Number(team.race_count) === 0
                      ? "Empty and unused"
                      : "In use"}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.team_id)}
                      disabled={
                        Number(team.member_count) > 0 ||
                        Boolean(team.coach_id) ||
                        Number(team.race_count) > 0
                      }
                      style={{
                        border: "none",
                        borderRadius: "6px",
                        backgroundColor:
                          Number(team.member_count) === 0 &&
                          !team.coach_id &&
                          Number(team.race_count) === 0
                            ? "#c62828"
                            : "#bdbdbd",
                        color: "white",
                        padding: "8px 10px",
                        cursor:
                          Number(team.member_count) === 0 &&
                          !team.coach_id &&
                          Number(team.race_count) === 0
                            ? "pointer"
                            : "not-allowed",
                        fontSize: "13px",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => navigate("/admin/events")}
          style={{
            marginTop: "20px",
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
