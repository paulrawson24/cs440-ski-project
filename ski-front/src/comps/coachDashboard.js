import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [race, setRace] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      navigate("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.user_id) throw new Error("Missing user id");
      setUser(parsed);

      // Fetch teams and map team_id to team_name
      if (parsed.team_id) {
        fetch("http://localhost:4000/api/teams")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((teams) => {
            //console.log("teams", teams)
            const team = teams.find((t) => t.team_id === parsed.team_id);
            if (team) setTeamName(team.team_name);
          })
          .catch(() => setError("Unable to load teams"));

        // Fetch races and map team_id to team?_id from races
        fetch("http://localhost:4000/api/races")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((races) => {
            const matchingRace = races.find(
              (r) =>
                r.team1_id === parsed.team_id || r.team2_id === parsed.team_id,
            );
            setRace(matchingRace.race_name);
          })
          .catch(() => setError("Unable to load races"));
      }
    } catch (err) {
      // If stored data is bad, force re-login
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

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

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
