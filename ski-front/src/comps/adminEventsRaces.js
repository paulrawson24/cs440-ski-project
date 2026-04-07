// Admin component for managing races
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

// Helper function to format time strings for display (e.g., "2:30 PM")
function formatTime(timeStr) {
  if (!timeStr) return "";
  const d = new Date(`1970-01-01T${timeStr}`);
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(/\s+/g, "");
}

// Helper function to format dates with dots (e.g., "Feb. 15, 2026")
function formatDateWithDot(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const month = d.toLocaleString("en-US", { month: "short" }); // "Feb"
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}. ${day}, ${year}`;
}

// Helper function to convert time string to minutes for comparison
function timeStringToMinutes(timeStr) {
  if (!timeStr) return NaN;
  const [h, m] = timeStr.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
}

export default function AdminEventsRaces() {
  const navigate = useNavigate();
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [courseId, setCourseId] = useState("");
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  
  const [teams, setTeams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [races, setRaces] = useState([]);
  const [message, setMessage] = useState("");

  // Load all data from API
  async function loadData() {
    const [teamsRes, coursesRes, racesRes] = await Promise.all([
      fetch(`${API_BASE}/teams`),
      fetch(`${API_BASE}/courses`),
      fetch(`${API_BASE}/races`),
    ]);

    if (teamsRes.ok) setTeams(await teamsRes.json());
    if (coursesRes.ok) setCourses(await coursesRes.json());
    if (racesRes.ok) setRaces(await racesRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle race creation with validation for scheduling conflicts
  async function handleCreateRace(event) {
    event.preventDefault();
    setMessage("");

    // Basic validation - ensure all required fields are filled
    if (!raceDate || !team1Id || !team2Id || !startTime || !endTime) {
      setMessage("Failed to create race");
      return;
    }

    const raceDay = new Date(raceDate);
    if (Number.isNaN(raceDay.getTime())) {
      setMessage("Failed to create race");
      return;
    }

    const month = raceDay.getMonth() + 1; // 1-based month
    const year = raceDay.getFullYear();
    if (year !== 2026 || month < 2 || month > 5) {
      setMessage("Failed to create race");
      return;
    }

    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = timeStringToMinutes(endTime);
    if (
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      startMinutes >= endMinutes
    ) {
      setMessage("Failed to create race");
      return;
    }

    const newTeam1 = Number(team1Id);
    const newTeam2 = Number(team2Id);
    const newCourseId = Number(courseId);

    const conflict = races.some((race) => {
      if (race.race_date !== raceDate) return false;

      const existingStart = timeStringToMinutes(race.start_time);
      const existingEnd = timeStringToMinutes(race.end_time);
      if (
        Number.isNaN(existingStart) ||
        Number.isNaN(existingEnd) ||
        existingStart >= existingEnd
      ) {
        return false;
      }

      const timeOverlap =
        startMinutes < existingEnd && endMinutes > existingStart;
      
      // Check if either team is already scheduled for another race at this time
      const teamConflict =
        race.team1_id === newTeam1 ||
        race.team2_id === newTeam1 ||
        race.team1_id === newTeam2 ||
        race.team2_id === newTeam2;

      // Check if the course already has a race scheduled at this time
      const courseConflict = race.course_id === newCourseId;

      // Conflict exists if there's time overlap AND either team or course conflict
      return timeOverlap && (teamConflict || courseConflict);
    });

    if (conflict) {
      setMessage("Failed to create race");
      return;
    }

    const response = await fetch(`${API_BASE}/races`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_name: raceName,
        race_date: raceDate,
        start_time: startTime,
        end_time: endTime,
        course_id: newCourseId,
        team1_id: newTeam1,
        team2_id: newTeam2,
      }),
    });
    if (!response.ok) {
      setMessage("Failed to create race");
      return;
    }
    setRaceName("");
    setRaceDate("");
    setStartTime("");
    setEndTime("");
    setCourseId("");
    setTeam1Id("");
    setTeam2Id("");
    setMessage("Race created");
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
          Create Race
        </h1>

        <form onSubmit={handleCreateRace} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text"
            placeholder="Enter race name"
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          <input
            type="date"
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                flex: 1,
                padding: "14px 12px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                flex: 1,
                padding: "14px 12px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.course_name}
              </option>
            ))}
          </select>

          <select
            value={team1Id}
            onChange={(e) => setTeam1Id(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Team 1</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>

          <select
            value={team2Id}
            onChange={(e) => setTeam2Id(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Team 2</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
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
            Create Race
          </button>
        </form>

        {message && <p style={{ color: "#1976d2", marginTop: "18px" }}>{message}</p>}

        <div style={{ overflowX: "auto", marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Race
                </th>
              </tr>
            </thead>
            <tbody>
              {races.map((race, index) => {
                const start = formatTime(race.start_time);
                const end = formatTime(race.end_time);
                const formattedDate = formatDateWithDot(race.race_date);
                const course = race.course_name || "Unknown course";
                const raceTitle =
                  race.team1_name && race.team2_name
                    ? `${race.team1_name} V ${race.team2_name}`
                    : race.race_name || "Unknown race";

                return (
                  <tr key={race.race_id}>
                    <td style={{ textAlign: "left", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                      {race.race_name}: {raceTitle} from {start} to {end} on {formattedDate} at {course}
                    </td>
                  </tr>
                );
              })}
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
