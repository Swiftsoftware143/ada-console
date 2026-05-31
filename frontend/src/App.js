import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import EmbedCodePage from "@/pages/EmbedCodePage";
import Settings from "@/pages/Settings";
import PersonalWebsites from "@/pages/PersonalWebsites";
import PersonalWebsiteDetail from "@/pages/PersonalWebsiteDetail";
import WidgetRequests from "@/pages/WidgetRequests";
import Profile from "@/pages/Profile";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/personal-websites" element={<PersonalWebsites />} />
              <Route path="/personal-websites/:id" element={<PersonalWebsiteDetail />} />
              <Route path="/widget-requests" element={<WidgetRequests />} />
              <Route path="/embed" element={<EmbedCodePage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
