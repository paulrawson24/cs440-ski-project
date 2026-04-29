import React from "react";
import { useNavigate } from "react-router-dom";

function getHomePath() {
  const stored = localStorage.getItem("user");

  if (!stored) return "/";

  try {
    const parsed = JSON.parse(stored);
    return `/${parsed.role || ""}`;
  } catch {
    return "/";
  }
}

export default function LeagueStats() {
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
          maxWidth: "460px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          borderRadius: "16px",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.24)",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: "24px", fontWeight: "700" }}>
          League Stats
        </h1>
        <p style={{ marginTop: 0, marginBottom: "24px", color: "#555" }}>
          Choose a stats report to view.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <button
            onClick={() => navigate("/league-stats/team")}
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
            Team Stats
          </button>
          <button
            onClick={() => navigate("/league-stats/skiers")}
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
            Skier Stats
          </button>
        </div>

        <button
          onClick={() => navigate(getHomePath())}
          style={{
            marginTop: "20px",
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
