// Coach dashboard component - displays coach information and team details
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [race, setRace] = useState("");
  const [teamResults, setTeamResults] = useState([]);

  useEffect(() => {
    // Load user data from localStorage on component mount
    const stored = localStorage.getItem("user");

    if (!stored) {
      navigate("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.user_id) throw new Error("Missing user id");
      setUser(parsed);

      // Fetch team information if coach is assigned to a team
      if (parsed.team_id) {
        fetch("http://localhost:4000/api/teams")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((teams) => {
            // Find the coach's team by team_id
            const team = teams.find((t) => t.team_id === parsed.team_id);
            if (team) setTeamName(team.team_name);
          })
          .catch(() => setError("Unable to load teams"));

        // Fetch race information for the coach's team
        fetch("http://localhost:4000/api/races")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((races) => {
            // Find races where the coach's team is participating
            const matchingRace = races.find(
              (r) =>
                r.team1_id === parsed.team_id || r.team2_id === parsed.team_id,
            );
            setRace(matchingRace.race_name);
          })
          .catch(() => setError("Unable to load races"));
      }

      fetch(`http://localhost:4000/api/coach/${parsed.user_id}/team-results`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setTeamResults(data.results || []))
        .catch(() => setError("Unable to load team results"));
    } catch (err) {
      // If stored data is corrupted, clear it and redirect to login
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  // Don't render until user data is loaded
  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Coach Dashboard</h1>
      <p>
        Welcome, Coach {user.first_name} {user.last_name}
      </p>
      <p>
        Team: {teamName || user.team_name || user.team_id || "Not assigned yet"}
      </p>
      <p>Race 1: {race}</p>
      <p>Team results:</p>
      <ul>
        {teamResults.length === 0 ? (
          <li>No results posted yet</li>
        ) : (
          teamResults.map((row, index) => (
            <li key={`${row.user_id}-${row.race_id || index}`}>
              {row.first_name} {row.last_name}
              {row.race_name ? ` - ${row.race_name}: ${row.time_seconds}s` : " - No results yet"}
            </li>
          ))
        )}
      </ul>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
