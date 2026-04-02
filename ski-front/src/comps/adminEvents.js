import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api/admin";

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
  const month = d.toLocaleString("en-US", { month: "short" }); // "Feb"
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}. ${day}, ${year}`;
}

function timeStringToMinutes(timeStr) {
  if (!timeStr) return NaN;
  const [h, m] = timeStr.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
}

export default function AdminEvents() {
  const [teamName, setTeamName] = useState("");
  const [courseName, setCourseName] = useState("");
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

  async function handleCreateRace(event) {
    event.preventDefault();
    setMessage("");

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
      const teamConflict =
        race.team1_id === newTeam1 ||
        race.team2_id === newTeam1 ||
        race.team1_id === newTeam2 ||
        race.team2_id === newTeam2;

      return timeOverlap && teamConflict;
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
              Race {index + 1}: {raceTitle} from {start} to {end} on {formattedDate} at {course}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
