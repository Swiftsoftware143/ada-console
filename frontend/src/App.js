import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import EmbedCodePage from "@/pages/EmbedCodePage";
import Settings from "@/pages/Settings";
import PersonalWebsites from "@/pages/PersonalWebsites";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/personal-websites" element={<PersonalWebsites />} />
            <Route path="/personal-websites/:id" element={<ClientDetail isPersonal={true} />} />
            <Route path="/embed" element={<EmbedCodePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
