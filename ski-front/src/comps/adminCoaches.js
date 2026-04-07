// Admin component for managing coach assignments to teams
import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api/admin";

export default function AdminCoaches() {
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

    if (!response.ok) {
      setMessage("Failed to assign coach");
      return;
    }

    setMessage("Coach assigned");
    setCoachId("");
    setTeamId("");
    loadData();
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Manage Coaches</h1>

      <form onSubmit={handleAssign}>
        <div>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "10px" }}>
          <select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
            <option value="">Select coach</option>
            {coaches.map((coach) => (
              <option key={coach.user_id} value={coach.user_id}>
                {coach.first_name} {coach.last_name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Assign Coach
        </button>
      </form>

      {message && <p>{message}</p>}

      <h2>Current Teams</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.team_id}>
            {team.team_name} - Coach: {team.coach_first_name ? `${team.coach_first_name} ${team.coach_last_name}` : "None"}
          </li>
        ))}
      </ul>
    </div>
  );
}
