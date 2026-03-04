import React from "react";

export default function Login() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Login</h1>

      <form>
        <div>
          <label>Email</label>
          <br/>
          <input type="text" />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Password</label>
          <br/>
          <input type="password" />
        </div>

        <button style={{ marginTop: "15px" }}>
          Login
        </button>
      </form>

    </div>
  );
}