// Admin dashboard component - main navigation hub for administrators
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Admin Dashboard</h1>
      <p>Select an area to manage:</p>

      {/* Navigation buttons to different admin management sections */}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button onClick={() => navigate("/admin/coaches")}>Manage Coaches</button>
        <button onClick={() => navigate("/admin/skiers")}>Manage Skiers</button>
        <button onClick={() => navigate("/admin/events")}>Manage Events</button>
      </div>
    </div>
  );
}
