// Skier dashboard component - displays skier information, team, members, and upcoming races
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function formatTime(timeStr) {
  if (!timeStr) return "";
  const d = new Date(`1970-01-01T${timeStr}`);
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(/\s+/g, "");
}

function formatDateWithDot(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}. ${day}, ${year}`;
}

function raceIncludesTeam(race, teamId) {
  const teamIds = Array.isArray(race.team_ids)
    ? race.team_ids
    : [race.team1_id, race.team2_id];
  return teamIds.map(Number).includes(Number(teamId));
}

function getRaceTitle(race) {
  if (Array.isArray(race.team_names) && race.team_names.length > 0) {
    return race.team_names.join(" V ");
  }

  if (race.team1_name && race.team2_name) return `${race.team1_name} V ${race.team2_name}`;
  return `${race.team1_id || "Team 1"} V ${race.team2_id || "Team 2"}`;
}

export default function SkierDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([]);
  const [races, setRaces] = useState([]);
  const [canceledRaces, setCanceledRaces] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

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

      if (parsed.team_id) {
        const skierTeamId = Number(parsed.team_id);

        Promise.all([
          fetch("http://localhost:4000/api/teams"),
          fetch("http://localhost:4000/api/admin/skiers"),
          fetch("http://localhost:4000/api/admin/races"),
          fetch(`http://localhost:4000/api/skier/${parsed.user_id}/results`),
        ])
          .then(async ([teamsRes, skiersRes, racesRes, resultsRes]) => {
            if (!teamsRes.ok || !skiersRes.ok || !racesRes.ok || !resultsRes.ok) {
              throw new Error("Unable to load data");
            }

            const [teamsData, skiersData, racesData, resultsData] = await Promise.all([
              teamsRes.json(),
              skiersRes.json(),
              racesRes.json(),
              resultsRes.json(),
            ]);

            const team = teamsData.find((t) => t.team_id === skierTeamId);
            if (team) setTeamName(team.team_name);

            setMembers(
              skiersData.filter((skier) => Number(skier.team_id) === skierTeamId),
            );

            const teamRaces = racesData.filter(
              (race) => raceIncludesTeam(race, skierTeamId),
            );
            setRaces(teamRaces.filter((race) => race.status !== "canceled"));
            setCanceledRaces(teamRaces.filter((race) => race.status === "canceled"));

            setResults(resultsData.results || []);
            setError("");
          })
          .catch(() => setError("Unable to load team details"));
      }
    } catch (err) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url('https://wallup.net/wp-content/uploads/2019/09/438113-ski-skiing-snow-winter-man-sport.jpg')",
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
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: "24px", fontWeight: "700" }}>
          Skier Dashboard
        </h1>

        <p style={{ margin: 0, marginBottom: "24px", color: "#555" }}>
          Welcome, {user.first_name} {user.last_name}
        </p>

        <button
          onClick={() => navigate("/league-stats")}
          style={{
            alignSelf: "flex-start",
            marginBottom: "24px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          League Stats
        </button>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "18px" }}>Team</p>
          <p style={{ marginTop: "8px", color: "#333" }}>
            {teamName || user.team_name || "Not assigned yet"}
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "18px" }}>Members</p>
          {members.length === 0 ? (
            <p style={{ marginTop: "8px", color: "#555" }}>No team members found.</p>
          ) : (
            <ul style={{ marginTop: "12px", paddingLeft: "18px", color: "#333" }}>
              {members.map((skier) => (
                <li key={skier.user_id} style={{ marginBottom: "8px" }}>
                  {skier.first_name} {skier.last_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: "#b3261e" }}>
            Alerts
          </p>
          {canceledRaces.length === 0 ? (
            <p style={{ marginTop: "8px", color: "#555" }}>
              No canceled race alerts.
            </p>
          ) : (
            <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "#b3261e" }}>
              {canceledRaces.map((race) => {
                const start = formatTime(race.start_time);
                const end = formatTime(race.end_time);
                const formattedDate = formatDateWithDot(race.race_date);
                const course = race.course_name || "Unknown course";
                const raceTitle = getRaceTitle(race);

                return (
                  <li key={race.race_id} style={{ marginBottom: "12px" }}>
                    Canceled: {race.race_name} - {raceTitle} from {start} to {end} on {formattedDate} at {course}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "18px" }}>
            Upcoming races
          </p>
          {races.length === 0 ? (
            <p style={{ marginTop: "8px", color: "#555" }}>
              No upcoming races scheduled for your team.
            </p>
          ) : (
            <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "#333" }}>
              {races.map((race) => {
                const start = formatTime(race.start_time);
                const end = formatTime(race.end_time);
                const formattedDate = formatDateWithDot(race.race_date);
                const course = race.course_name || "Unknown course";
                const raceTitle = getRaceTitle(race);

                return (
                  <li key={race.race_id} style={{ marginBottom: "12px" }}>
                    {race.race_name}: {raceTitle} from {start} to {end} on {formattedDate} at {course}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "18px" }}>
            My race results
          </p>
          {results.length === 0 ? (
            <p style={{ marginTop: "8px", color: "#555" }}>No results posted yet.</p>
          ) : (
            <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "#333" }}>
              {results.map((result, index) => (
                <li key={`${result.race_id}-${index}`} style={{ marginBottom: "8px" }}>
                  {result.race_name} on {formatDateWithDot(result.race_date)} - {result.time_seconds}s
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
      </div>
    </div>
  );
}
