import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import ButtonAppBar from "./comps/baseAppBar";
import Login from "./comps/login";
import Register from "./comps/register";
import AdminDashboard from "./comps/adminDashboard";
import AdminCoaches from "./comps/adminCoaches";
import AdminSkiers from "./comps/adminSkiers";
import AdminEvents from "./comps/adminEvents";
import AdminEventsTeams from "./comps/adminEventsTeams";
import AdminEventsCourses from "./comps/adminEventsCourses";
import AdminEventsRaces from "./comps/adminEventsRaces";
import AdminTeamStats from "./comps/adminTeamStats";
import LeagueSkierStats from "./comps/leagueSkierStats";
import SkierDashboard from "./comps/skierDashboard";
import CoachDashboard from "./comps/coachDashboard";

// Simple home page component
function Home() {
  return (
    <div
      style={{
        padding: 40,
        textAlign: 'center',
        backgroundImage: 'url(https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: '16px',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.24)',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, marginBottom: '24px', fontWeight: '700' }}>Welcome</h1>
        <p style={{ marginBottom: '24px', color: '#555' }}>
          Welcome to the ski league management page. Please login to continue.
        </p>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <button
            style={{
              width: '100%',
              padding: '14px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#1976d2',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        </Link>
      </div>
    </div>
  );
}

// Main App component that sets up routing for the entire application
function AppRoutes() {
  const location = useLocation();
  const hideAppBar = location.pathname === "/league-stats" || location.pathname === "/league-stats/skiers";

  return (
    <>
      {!hideAppBar ? <ButtonAppBar /> : null}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Admin routes for managing the ski league */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/coaches" element={<AdminCoaches />} />
        <Route path="/admin/skiers" element={<AdminSkiers />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/events/teams" element={<AdminEventsTeams />} />
        <Route path="/admin/events/courses" element={<AdminEventsCourses />} />
        <Route path="/admin/events/races" element={<AdminEventsRaces />} />
        <Route path="/league-stats" element={<AdminTeamStats />} />
        <Route path="/league-stats/skiers" element={<LeagueSkierStats />} />
        {/* Dashboard routes for coaches and skiers */}
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/skier" element={<SkierDashboard />} />
      </Routes>
    </>
  );
}

export default function App() {
  const theme = createTheme({
    palette: {
      primary: { main: "#1976d2" },
      background: { default: "#f5f7fb" },
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
