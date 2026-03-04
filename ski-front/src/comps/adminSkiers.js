import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api/admin";

export default function AdminSkiers() {
  const [teams, setTeams] = useState([]);
  const [skiers, setSkiers] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [skierId, setSkierId] = useState("");
  const [message, setMessage] = useState("");

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

  return (
    <div style={{ padding: "40px" }}>
      <h1>Manage Skiers</h1>

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
          <select value={skierId} onChange={(e) => setSkierId(e.target.value)}>
            <option value="">Select skier</option>
            {skiers.map((skier) => (
              <option key={skier.user_id} value={skier.user_id}>
                {skier.first_name} {skier.last_name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Assign Skier
        </button>
      </form>

      {message && <p>{message}</p>}

      <h2>All Skiers</h2>
      <ul>
        {skiers.map((skier) => (
          <li key={skier.user_id}>
            {skier.first_name} {skier.last_name} - Team ID: {skier.team_id || "None"}
          </li>
        ))}
      </ul>
    </div>
  );
}
