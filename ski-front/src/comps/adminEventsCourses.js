// Admin component for managing courses
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/admin";

export default function AdminEventsCourses() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");

    const isFormValid = courseName !== '';


  // Load courses data from API
  async function loadData() {
    const coursesRes = await fetch(`${API_BASE}/courses`);
    if (coursesRes.ok) setCourses(await coursesRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle course creation
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
          Create Course
        </h1>

        <form onSubmit={handleCreateCourse} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            required
            type="text"
            placeholder="Enter course name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

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
              cursor: isFormValid ? "pointer" : "not-allowed",
            }}
          >
            Create Course
          </button>
        </form>

        {message && <p style={{ color: "#1976d2", marginTop: "18px" }}>{message}</p>}

        <div style={{ overflowX: "auto", marginTop: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center", padding: "12px 8px", borderBottom: "2px solid #e0e0e0" }}>
                  Course
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.course_id}>
                  <td style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #eee" }}>
                    {course.course_name}
                  </td>
                </tr>
              ))}
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
