// User registration component
import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("");
  const [error, setError] = React.useState("");

  // Navigate back to login page
  const handleBack = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  // Handle form submission for user registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const data = {
      firstName,
      lastName,
      email,
      password,
      role
    };

    try {
      // Send registration data to backend API
      const response = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Register failed");
        return;
      }

      // Redirect to login page after successful registration
      navigate("/login");

    } catch (error) {
      setError("Server connection failed");
    }
  };

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
          Register
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
              marginBottom: "16px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 12px",
              marginBottom: "24px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
              backgroundColor: "white",
            }}
          >
            <option value="" disabled>
              Enter your role
            </option>
            <option value="skier">Skier</option>
            <option value="coach">Coach</option>
            <option value="admin">League Admin</option>
          </select>
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
            Register
          </button>
        </form>

        <p style={{ marginTop: "22px", fontSize: "14px", color: "#555" }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: "#1976d2", textDecoration: "none", fontWeight: "600" }}>
            Login
          </Link>
        </p>

        {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
      </div>
    </div>
  );
}
