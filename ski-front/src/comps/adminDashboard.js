// Admin dashboard component - main navigation hub for administrators
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
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
          Admin Dashboard
        </h1>
        <p style={{ marginTop: 0, marginBottom: "24px", color: "#555" }}>
          Select an area to manage:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <button
            onClick={() => navigate("/admin/coaches")}
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
            Manage Coaches
          </button>
          <button
            onClick={() => navigate("/admin/skiers")}
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
            Manage Skiers
          </button>
          <button
            onClick={() => navigate("/admin/events")}
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
            Manage Events
          </button>
        </div>
      </div>
    </div>
  );
}
