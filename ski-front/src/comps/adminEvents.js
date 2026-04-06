// Admin component for managing ski league events (teams, courses, and races)
import React, { useEffect, useState } from "react";

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

export default function AdminEvents() {
  // Form state for creating new entities
  const [teamName, setTeamName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [courseId, setCourseId] = useState("");
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");

  // Data state for displaying existing entities
  const [teams, setTeams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [races, setRaces] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [resultsRaceData, setResultsRaceData] = useState(null);
  const [resultsForm, setResultsForm] = useState({});
  const [resultsMessage, setResultsMessage] = useState("");

  // Load all teams, courses, and races data from API
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

  async function handleLoadResults(raceId) {
    setResultsMessage("");
    setSelectedRaceId(raceId);

    const response = await fetch(`${API_BASE}/races/${raceId}/results`);
    const data = await response.json();

    if (!response.ok) {
      setResultsRaceData(null);
      setResultsForm({});
      setResultsMessage(data.error || "Failed to load race results");
      return;
    }

    setResultsRaceData(data);

    const initialForm = {};
    data.skiers.forEach((skier) => {
      initialForm[skier.user_id] = skier.time_seconds ?? "";
    });
    setResultsForm(initialForm);
  }

  function handleResultChange(userId, value) {
    setResultsForm((current) => ({
      ...current,
      [userId]: value,
    }));
  }

  async function handleSaveResults(event) {
    event.preventDefault();
    setResultsMessage("");

    if (!selectedRaceId || !resultsRaceData) {
      setResultsMessage("Select a race first");
      return;
    }

    const results = resultsRaceData.skiers.map((skier) => ({
      user_id: skier.user_id,
      time_seconds: Number(resultsForm[skier.user_id]),
    }));

    if (results.some((item) => !Number.isInteger(item.time_seconds) || item.time_seconds <= 0)) {
      setResultsMessage("Each skier must have a positive whole-number time");
      return;
    }

    const response = await fetch(`${API_BASE}/races/${selectedRaceId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });

    const data = await response.json();

    if (!response.ok) {
      setResultsMessage(data.error || "Failed to save race results");
      return;
    }

    setResultsMessage("Race results saved");
    handleLoadResults(selectedRaceId);
  }

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

  async function handleCreateCourse(event) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`${API_BASE}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_name: courseName }),
    });
    if (!response.ok) {
      setMessage("Failed to create course");
      return;
    }
    setCourseName("");
    setMessage("Course created");
    loadData();
  }

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
        course_id: Number(courseId),
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
    <div style={{ padding: "40px" }}>
      <h1>Manage Events</h1>

      <h2>Create Team</h2>
      <form onSubmit={handleCreateTeam}>
        <input
          type="text"
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <button type="submit">Create Team</button>
      </form>

      <h2>Create Course</h2>
      <form onSubmit={handleCreateCourse}>
        <input
          type="text"
          placeholder="Course name"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
        />
        <button type="submit">Create Course</button>
      </form>

      <h2>Create Race</h2>
      <form onSubmit={handleCreateRace}>
        <div>
          <input
            type="text"
            placeholder="Race name"
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
          />
        </div>
        <div>
          <input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} />
        </div>
        <div>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.course_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select value={team1Id} onChange={(e) => setTeam1Id(e.target.value)}>
            <option value="">Team 1</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
          <select value={team2Id} onChange={(e) => setTeam2Id(e.target.value)}>
            <option value="">Team 2</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Create Race</button>
      </form>

      {message && <p>{message}</p>}

      <h2>Teams</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.team_id}>
            {team.team_id} - {team.team_name}
          </li>
        ))}
      </ul>

      <h2>Courses</h2>
      <ul>
        {courses.map((course) => (
          <li key={course.course_id}>
            {course.course_id} - {course.course_name}
          </li>
        ))}
      </ul>

      <h2>Races</h2>
      <ul>
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
            <li key={race.race_id}>
              {race.race_name}: {raceTitle} from {start} to {end} on {formattedDate} at {course}
              <button
                type="button"
                style={{ marginLeft: "10px" }}
                onClick={() => handleLoadResults(race.race_id)}
              >
                Enter Results
              </button>
            </li>
          );
        })}
      </ul>

      {resultsRaceData && (
        <div style={{ marginTop: "30px" }}>
          <h2>Enter Results</h2>
          <p>
            {resultsRaceData.race.race_name}: {resultsRaceData.race.team1_name} vs{" "}
            {resultsRaceData.race.team2_name}
          </p>

          <form onSubmit={handleSaveResults}>
            {[
              {
                teamId: resultsRaceData.race.team1_id,
                teamName: resultsRaceData.race.team1_name,
              },
              {
                teamId: resultsRaceData.race.team2_id,
                teamName: resultsRaceData.race.team2_name,
              },
            ].map((team) => (
              <div key={team.teamId} style={{ marginBottom: "20px" }}>
                <h3>{team.teamName}</h3>
                {resultsRaceData.skiers
                  .filter((skier) => skier.team_id === team.teamId)
                  .map((skier) => (
                    <div key={skier.user_id} style={{ marginBottom: "10px" }}>
                      <label>
                        {skier.first_name} {skier.last_name} Time (seconds)
                      </label>
                      <br />
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={resultsForm[skier.user_id] ?? ""}
                        onChange={(e) => handleResultChange(skier.user_id, e.target.value)}
                      />
                    </div>
                  ))}
              </div>
            ))}

            <button type="submit">Save Results</button>
          </form>

          {resultsMessage && <p>{resultsMessage}</p>}
        </div>
      )}
    </div>
  );
}
