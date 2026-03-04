import { BrowserRouter, Routes, Route } from "react-router-dom";
import ButtonAppBar from "./comps/baseAppBar";
import Login from "./comps/login";
import Register from "./comps/register";

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
      </Routes>
    </BrowserRouter>
  );
}