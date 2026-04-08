// Admin component for managing coach assignments to teams
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

export default function AdminCoaches() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [message, setMessage] = useState("");

  // Load teams and coaches data from API
  async function loadData() {
    const [teamsRes, coachesRes] = await Promise.all([
      fetch(`${API_BASE}/teams`),
      fetch(`${API_BASE}/coaches`),
    ]);

    if (teamsRes.ok) setTeams(await teamsRes.json());
    if (coachesRes.ok) setCoaches(await coachesRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle coach assignment to team
  async function handleAssign(event) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(`${API_BASE}/teams/${teamId}/coach`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach_id: Number(coachId) }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data?.error || "Failed to assign coach");
      return;
    }

    setMessage("Coach assigned");
    setCoachId("");
    setTeamId("");
    loadData();
  }

  // Helper function to get team name assigned to a coach
  function getTeamNameForCoach(coach) {
    if (!coach?.team_id) return "None";
    const team = teams.find((t) => t.team_id === Number(coach.team_id));
    return team ? team.team_name : "None";
  }

  async function handleRemoveFromTeam(userId) {
    setMessage("");

    const response = await fetch(`${API_BASE}/coaches/${userId}/remove-team`, {
      method: "PUT",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to remove coach from team");
      return;
    }

    setMessage("Coach removed from team");
    loadData();
  }

  async function handleDeleteCoach(userId) {
    setMessage("");

    const response = await fetch(`${API_BASE}/coaches/${userId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to delete coach");
      return;
    }

    setMessage("Coach deleted");
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
          Manage Coaches
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
            value={coachId}
            onChange={(e) => setCoachId(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Select coach</option>
            {coaches.map((coach) => (
              <option key={coach.user_id} value={coach.user_id}>
                {coach.first_name} {coach.last_name}
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
            Assign Coach
          </button>
        </form>

        {message && <p style={{ color: "#1976d2", marginTop: "18px" }}>{message}</p>}

        <div style={{ overflowX: "auto", marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Coach
                </th>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Team
                </th>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.user_id}>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {coach.first_name} {coach.last_name}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {getTeamNameForCoach(coach)}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {coach.team_id || Number(coach.is_assigned_coach) === 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveFromTeam(coach.user_id)}
                        style={{
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "#f57c00",
                          color: "white",
                          padding: "8px 10px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Remove From Team
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteCoach(coach.user_id)}
                        style={{
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "#c62828",
                          color: "white",
                          padding: "8px 10px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Delete
                      </button>
                    )}
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
