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


function Home() {
  return <div style={{ padding: 40, fontSize: 30 }}>HOME</div>;
}


export default function App() {
  return (
    <BrowserRouter>
      <ButtonAppBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/coaches" element={<AdminCoaches />} />
        <Route path="/admin/skiers" element={<AdminSkiers />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/skier" element={<SkierDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
