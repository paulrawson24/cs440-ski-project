import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api/admin";

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
    const response = await fetch(`${API_BASE}/races`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_name: raceName,
        race_date: raceDate,
        start_time: startTime,
        end_time: endTime,
        course_id: Number(courseId),
        team1_id: Number(team1Id),
        team2_id: Number(team2Id),
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
        {races.map((race) => (
          <li key={race.race_id}>
            {race.race_name} ({race.race_date}) {race.team1_name} vs {race.team2_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
