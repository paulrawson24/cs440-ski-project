// Login component for user authentication
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{ padding: "40px" }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <br/>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Password</label>
          <br/>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" style={{ marginTop: "15px" }}>
          Login
        </button>

        <button type="button" onClick={() => navigate("/register")} style={{ marginLeft: "32px"}}>
          Register
        </button>

      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}

    </div>
  );
}
