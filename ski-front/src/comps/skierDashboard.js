// Skier dashboard component - displays skier information, team, and upcoming races
import { List, ListItem } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SkierDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [racesList, setRacesList] = useState([]);
  const [results, setResults] = useState([]);

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

      // Fetch team information if skier is assigned to a team
      if (parsed.team_id) {
        fetch("http://localhost:4000/api/teams")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((teams) => {
            // Find the skier's team by team_id
            const team = teams.find((t) => t.team_id === parsed.team_id);
            if (team) setTeamName(team.team_name);
          })
          .catch(() => setError("Unable to load teams"));

        // Fetch all races and filter for skier's team
        fetch("http://localhost:4000/api/races")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((races) => {
            // Find all races where the skier's team is participating
            const matchingRaces = races.filter(
              (r) =>
                r.status !== "canceled" &&
                (r.team1_id === parsed.team_id || r.team2_id === parsed.team_id)
            );
            setRacesList(matchingRaces);
          })
          .catch(() => setError("Unable to load races"));
      }

      fetch(`http://localhost:4000/api/skier/${parsed.user_id}/results`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setResults(data.results || []))
        .catch(() => setError("Unable to load race results"));
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
      <h1>Skier Dashboard</h1>
      <p>
        Welcome, {user.first_name} {user.last_name}
      </p>
      <p>Team: {teamName || user.team_name || user.team_id || "Not assigned yet"}</p>
      <p>Upcoming races:</p>
      {/* Display list of races for the skier's team */}
      <List>
        {racesList.length === 0 ? (
          <ListItem disabled>No races scheduled for your team yet</ListItem>
        ) : (
          racesList.map((race) => (
            <ListItem key={race.race_id}>{race.race_name} {race.start_time}-{race.end_time} {race.race_date}</ListItem>
          ))
        )}
      </List>
      <p>My race results:</p>
      <List>
        {results.length === 0 ? (
          <ListItem disabled>No results posted yet</ListItem>
        ) : (
          results.map((result, index) => (
            <ListItem key={`${result.race_id}-${index}`}>
              {result.race_name} {result.race_date} - {result.time_seconds}s
            </ListItem>
          ))
        )}
      </List>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
