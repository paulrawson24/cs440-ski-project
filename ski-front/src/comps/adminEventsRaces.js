// Admin component for managing races
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}. ${day}, ${year}`;
}

function timeStringToMinutes(timeStr) {
  if (!timeStr) return NaN;
  const [h, m] = timeStr.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
}

function parseRaceDateTime(dateStr, timeStr) {
  const value = new Date(`${dateStr}T${timeStr}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getRaceTeamIds(race) {
  if (Array.isArray(race.team_ids)) return race.team_ids.map(Number);
  return [race.team1_id, race.team2_id].map(Number).filter(Boolean);
}

function getRaceTitle(race) {
  if (Array.isArray(race.team_names) && race.team_names.length > 0) {
    return race.team_names.join(" V ");
  }

  if (race.team1_name && race.team2_name) return `${race.team1_name} V ${race.team2_name}`;
  return race.race_name || "Unknown race";
}

function buttonStyle(backgroundColor = "#1976d2") {
  return {
    border: "none",
    borderRadius: "8px",
    backgroundColor,
    color: "white",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
  };
}

export default function AdminEventsRaces() {
  const navigate = useNavigate();
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [races, setRaces] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [resultsRaceData, setResultsRaceData] = useState(null);
  const [resultsForm, setResultsForm] = useState({});
  const [resultsMessage, setResultsMessage] = useState("");

  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);

let createRaceError = "";

if (!raceName) createRaceError = "Enter a race name";
else if (!raceDate) createRaceError = "Select a race date";
else if (!startTime) createRaceError = "Select a start time";
else if (!endTime) createRaceError = "Select an end time";
else if (!courseId) createRaceError = "Select a course";
else if (selectedTeamIds.length < 2) createRaceError = "Select at least two teams";
else if (
  Number.isNaN(startMinutes) ||
  Number.isNaN(endMinutes) ||
  startMinutes >= endMinutes
) createRaceError = "End time must be after start time";
const raceStart = parseRaceDateTime(raceDate, startTime);

if (raceStart && raceStart <= new Date()) {
  createRaceError = "Race must be present, not in the past";
}

const isFormValid = createRaceError === "";


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

  async function handleCreateRace(event) {
    event.preventDefault();
    setMessage("");

    if (!raceName || !raceDate || selectedTeamIds.length < 2 || !courseId || !startTime || !endTime) {
      setMessage("Fill in all race fields");
      return;
    }

    const raceDay = new Date(raceDate);
    if (Number.isNaN(raceDay.getTime())) {
      setMessage("Enter a valid race date");
      return;
    }

    const month = raceDay.getMonth() + 1;
    const year = raceDay.getFullYear();
    if (year !== 2026 || month < 2 || month > 5) {
      setMessage("Race date must be between February 1, 2026 and May 31, 2026");
      return;
    }

    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = timeStringToMinutes(endTime);
    if (
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      startMinutes >= endMinutes
    ) {
      setMessage("Race end time must be after the start time");
      return;
    }

    const raceStart = parseRaceDateTime(raceDate, startTime);
    if (!raceStart) {
      setMessage("Enter a valid race date and time");
      return;
    }

    if (raceStart <= new Date()) {
      setMessage("Race must be scheduled for a future date and time");
      return;
    }

    const newTeamIds = selectedTeamIds.map(Number);
    const newCourseId = Number(courseId);

    const conflict = races.some((race) => {
      if (race.race_date !== raceDate || race.status === "canceled") return false;

      const existingStart = timeStringToMinutes(race.start_time);
      const existingEnd = timeStringToMinutes(race.end_time);
      if (
        Number.isNaN(existingStart) ||
        Number.isNaN(existingEnd) ||
        existingStart >= existingEnd
      ) {
        return false;
      }

      const timeOverlap = startMinutes < existingEnd && endMinutes > existingStart;
      const raceTeamIds = getRaceTeamIds(race);
      const teamConflict = raceTeamIds.some((teamId) => newTeamIds.includes(teamId));
      const courseConflict = race.course_id === newCourseId;

      return timeOverlap && (teamConflict || courseConflict);
    });

    if (conflict) {
      const teamConflict = races.some((race) => {
        if (race.race_date !== raceDate || race.status === "canceled") return false;

        const existingStart = timeStringToMinutes(race.start_time);
        const existingEnd = timeStringToMinutes(race.end_time);
        const timeOverlap = startMinutes < existingEnd && endMinutes > existingStart;

        const raceTeamIds = getRaceTeamIds(race);
        return timeOverlap && raceTeamIds.some((teamId) => newTeamIds.includes(teamId));
      });

      setMessage(
        teamConflict
          ? "One of those teams already has a race during that time"
          : "That course already has a race scheduled during that time",
      );
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
        team_ids: newTeamIds,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to create race");
      return;
    }

    setRaceName("");
    setRaceDate("");
    setStartTime("");
    setEndTime("");
    setCourseId("");
    setSelectedTeamIds([]);
    setMessage(data.message || "Race created");
    await loadData();
  }

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

  function handleTeamToggle(teamId) {
    const numericTeamId = Number(teamId);
    setSelectedTeamIds((current) =>
      current.includes(numericTeamId)
        ? current.filter((id) => id !== numericTeamId)
        : [...current, numericTeamId]
    );
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

    setMessage("Race results saved");
    handleCloseResults();
  }
  function handleCloseResults() {
    setSelectedRaceId("");
    setResultsRaceData(null);
    setResultsForm({});
    setResultsMessage("");
  }
  async function handleCancelRace(raceId) {
    setMessage("");
    setResultsMessage("");

    const response = await fetch(`${API_BASE}/races/${raceId}/cancel`, {
      method: "PUT",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to cancel race");
      return;
    }

    if (selectedRaceId === raceId && resultsRaceData) {
      setResultsRaceData({
        ...resultsRaceData,
        race: { ...resultsRaceData.race, status: "canceled" },
      });
    }

    setMessage("Race canceled");
    loadData();
  }

  async function handleDeleteRace(raceId) {
    setMessage("");
    setResultsMessage("");

    const response = await fetch(`${API_BASE}/races/${raceId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to delete race");
      return;
    }

    if (selectedRaceId === raceId) {
      setSelectedRaceId("");
      setResultsRaceData(null);
      setResultsForm({});
    }

    setMessage("Race deleted");
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
          maxWidth: "760px",
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
            required
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
            required
            min="2026-02-01" 
            max="2026-05-31"
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
              required
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
              required
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
            required
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

          <div
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
              backgroundColor: "white",
              textAlign: "left",
            }}
          >
            <p style={{ margin: "0 0 10px", fontWeight: 700 }}>Teams</p>
            {teams.map((team) => (
              <label key={team.team_id} style={{ display: "block", marginBottom: "8px" }}>
                <input
                  type="checkbox"
                  checked={selectedTeamIds.includes(Number(team.team_id))}
                  onChange={() => handleTeamToggle(team.team_id)}
                  style={{ marginRight: "8px" }}
                />
                {team.team_name}
              </label>
            ))}
          </div>

          <div
            title={!isFormValid ? createRaceError : ""}
            style={{
            width: "100%",
            cursor: "pointer",
            }}
          >
          <button
            disabled={!isFormValid}
            type="submit"
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: isFormValid ? "#1976d2" : "#a9aeb2",
              color: isFormValid ? "white" : "#343434",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Create Race
          </button>
</div>
        </form>

        {message && <p style={{ color: "#1976d2", marginTop: "18px" }}>{message}</p>}

        <div style={{ overflowX: "auto", marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Race
                </th>
                <th style={{ textAlign: "left", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => {
                const start = formatTime(race.start_time);
                const end = formatTime(race.end_time);
                const formattedDate = formatDateWithDot(race.race_date);
                const course = race.course_name || "Unknown course";
                const raceTitle = getRaceTitle(race);
                const isCanceled = race.status === "canceled";

                return (
                  <tr key={race.race_id}>
                    <td style={{ textAlign: "left", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                      {race.race_name}: {raceTitle} from {start} to {end} on {formattedDate} at {course}
                    </td>
                    <td style={{ textAlign: "left", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                      <span style={{ color: isCanceled ? "#c62828" : "#2e7d32", fontWeight: 600 }}>
                        {isCanceled ? "Canceled" : "Scheduled"}
                      </span>
                    </td>
                    <td style={{ textAlign: "left", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleLoadResults(race.race_id)}
                          disabled={isCanceled}
                          style={{
                            ...buttonStyle(isCanceled ? "#9e9e9e" : "#1976d2"),
                            cursor: isCanceled ? "not-allowed" : "pointer",
                          }}
                        >
                          Enter Results
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelRace(race.race_id)}
                          disabled={isCanceled}
                          style={{
                            ...buttonStyle(isCanceled ? "#9e9e9e" : "#d32f2f"),
                            cursor: isCanceled ? "not-allowed" : "pointer",
                          }}
                        >
                          {isCanceled ? "Canceled" : "Cancel Race"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRace(race.race_id)}
                          disabled={!isCanceled}
                          style={{
                            ...buttonStyle(isCanceled ? "#c62828" : "#9e9e9e"),
                            cursor: isCanceled ? "pointer" : "not-allowed",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {resultsRaceData && (
          <div style={{ marginTop: "30px", textAlign: "left" }}>
            <h2 style={{ marginBottom: "8px" }}>Enter Results</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              {resultsRaceData.race.race_name}: {getRaceTitle(resultsRaceData.race)}
              {resultsRaceData.race.status ? ` (${resultsRaceData.race.status})` : ""}
            </p>

            <form onSubmit={handleSaveResults}>
              {resultsRaceData.race.team_ids.map((teamId, index) => (
                <div key={teamId} style={{ marginBottom: "20px" }}>
                  <h3>{resultsRaceData.race.team_names[index]}</h3>
                  {resultsRaceData.skiers
                    .filter((skier) => Number(skier.team_id) === Number(teamId))
                    .map((skier) => (
                      <div key={skier.user_id} style={{ marginBottom: "10px" }}>
                        <label htmlFor={`result-${skier.user_id}`}>
                          {skier.first_name} {skier.last_name} Time (seconds)
                        </label>
                        <br />
                        <input
                          id={`result-${skier.user_id}`}
                          type="number"
                          min="1"
                          step="1"
                          value={resultsForm[skier.user_id] ?? ""}
                          onChange={(e) => handleResultChange(skier.user_id, e.target.value)}
                          style={{
                            marginTop: "6px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            width: "220px",
                          }}
                        />
                      </div>
                    ))}
                </div>
              ))}

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                <button type="submit" style={buttonStyle()}>
                  Save Results
                </button>
                <button
                  type="button"
                  onClick={handleCloseResults}
                  style={buttonStyle("#1976d2")}
                >
                  Close Results
                </button>
              </div>
            </form>

            {resultsMessage && <p style={{ color: "#1976d2", marginTop: "16px" }}>{resultsMessage}</p>}
          </div>
        )}

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
