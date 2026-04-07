// Login component for user authentication
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handle form submission for user login
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      // Send login credentials to backend API
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError("Invalid login");
        return;
      }

      const user = await response.json();

      // Store user data in localStorage for session persistence
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect user to appropriate dashboard based on their role
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "coach") navigate("/coach");
      else if (user.role === "skier") navigate("/skier");
      else setError("Unknown role");
    } catch (err) {
      setError("Server connection failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url('https://external-preview.redd.it/skiing-4k-wallpaper-3840-x-2160-v0-8KzeDceg2UZLClcu8nCYzf9c_owu7w6JDNJeG3Mpwx8.jpg?auto=webp&s=02c8b08086b9f7f48ab9bb711790160b4c6f3ff2')",
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
          Login
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              marginBottom: "16px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              marginBottom: "24px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
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
            Login
          </button>
        </form>

        <p style={{ marginTop: "22px", fontSize: "14px", color: "#555" }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: "#1976d2", textDecoration: "none", fontWeight: "600" }}>
            Register
          </Link>
        </p>

        {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
      </div>
    </div>
  );
}
