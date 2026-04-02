import { BrowserRouter, Routes, Route } from "react-router-dom";
import ButtonAppBar from "./comps/baseAppBar";
import Login from "./comps/login";
import Register from "./comps/register";
import AdminDashboard from "./comps/adminDashboard";
import AdminCoaches from "./comps/adminCoaches";
import AdminSkiers from "./comps/adminSkiers";
import AdminEvents from "./comps/adminEvents";
import SkierDashboard from "./comps/skierDashboard";
import CoachDashboard from "./comps/coachDashboard";

// Simple home page component
function Home() {
  return <div style={{ padding: 40, fontSize: 30 }}>HOME</div>;
}

// Main App component that sets up routing for the entire application
export default function App() {
  return (
    // BrowserRouter enables client-side routing
    <BrowserRouter>
      {/* Navigation bar shown on all pages */}
      <ButtonAppBar />
      {/* Define all application routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Admin routes for managing the ski league */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/coaches" element={<AdminCoaches />} />
        <Route path="/admin/skiers" element={<AdminSkiers />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        {/* Dashboard routes for coaches and skiers */}
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/skier" element={<SkierDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
