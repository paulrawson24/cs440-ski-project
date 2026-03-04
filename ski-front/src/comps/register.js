import React from "react";
import { useNavigate } from "react-router-dom";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("");

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Hit submit");
    const data = {
      firstName,
      lastName,
      email,
      password,
      role
    };

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log(result);

      navigate("/login");

    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name</label><br/>
          <input
            type="text"
            value={firstName}
            onChange={(e)=>setFirstName(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Last Name</label><br/>
          <input
            type="text"
            value={lastName}
            onChange={(e)=>setLastName(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Email</label><br/>
          <input
            type="text"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Password</label><br/>
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "20px", maxWidth: 150 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="Skier">Skier</MenuItem>
              <MenuItem value="Coach">Coach</MenuItem>
              <MenuItem value="League Admin">League Admin</MenuItem>
            </Select>
          </FormControl>
        </div>

        <button onClick={handleSubmit} type="submit" style={{ marginTop: "15px" }}>
          Register
        </button>

        <button type="button" onClick={handleBack} style={{ marginLeft: "32px" }}>
          Back
        </button>
      </form>
    </div>
  );
}