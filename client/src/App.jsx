import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Catalog from "./pages/Catalog";
import RequestForm from "./pages/RequestForm";
import InvitationView from "./pages/InvitationView";
import Dashboard from "./pages/Dashboard";
import HostPanel from "./pages/HostPanel";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/solicitar" element={<RequestForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/panel/:slug" element={<HostPanel />} />
        <Route path="/:slug" element={<InvitationView />} />
      </Routes>
    </BrowserRouter>
  );
}