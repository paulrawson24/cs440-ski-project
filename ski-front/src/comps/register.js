import React from "react";
import { useNavigate } from "react-router-dom";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = React.useState("");

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Selected role:", role);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name</label>
          <br />
          <input type="text" />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Last Name</label>
          <br />
          <input type="text" />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Email</label>
          <br />
          <input type="text" />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Password</label>
          <br />
          <input type="password" />
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

        <button onClick={handleBack} style={{ marginLeft: "32px" }}>
          Back
        </button>
      </form>
    </div>
  );
}