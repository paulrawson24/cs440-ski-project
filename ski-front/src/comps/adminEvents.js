// Admin Events navigation component
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminEvents() {
  const navigate = useNavigate();

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
          maxWidth: "420px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          borderRadius: "16px",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.24)",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: "24px", fontWeight: "700" }}>
          Manage Events
        </h1>
        <p style={{ marginTop: 0, marginBottom: "24px", color: "#555" }}>
          Select an event to manage:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <button
            onClick={() => navigate("/admin/events/teams")}
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
            Create Team
          </button>
          <button
            onClick={() => navigate("/admin/events/courses")}
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
            Create Course
          </button>
          <button
            onClick={() => navigate("/admin/events/races")}
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
        </div>

        <button
          onClick={() => navigate("/admin")}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#1976d2",
            color: "white",
            fontSize: "14px",
            cursor: "pointer",
            display: "block",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
