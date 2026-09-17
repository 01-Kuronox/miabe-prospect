import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import SplashScreen from "./components/SplashScreen";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Prospects from "./pages/Prospects";
import ProspectDetail from "./pages/ProspectDetail";
import Pipeline from "./pages/Pipeline";
import FollowUps from "./pages/FollowUps";
import Assistant from "./pages/Assistant";
import Import from "./pages/Import";

function AppRoutes() {
  const { company, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-gray)] text-sm text-gray-500">
        Chargement...
      </div>
    );
  }

  if (!company) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prospects" element={<Prospects />} />
          <Route path="/prospects/:id" element={<ProspectDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/relances" element={<FollowUps />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/import" element={<Import />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  // L'écran d'accueil s'affiche à chaque ouverture/rafraîchissement de la
  // page (choix validé avec l'équipe), puis laisse place à l'application.
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
