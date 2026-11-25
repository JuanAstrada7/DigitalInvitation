import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import InvitationView from "./pages/InvitationView";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/prueba-boda" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/panel/:slug" element={<Dashboard />} />
        <Route path="/:slug" element={<InvitationView />} />
      </Routes>
    </BrowserRouter>
  );
}