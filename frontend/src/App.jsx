import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import SplashScreen from "./components/SplashScreen";
import WakingNotice from "./components/WakingNotice";
import { AuthProvider, useAuth } from "./AuthContext";
import { warmUp, startKeepAlive } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Prospects from "./pages/Prospects";
import ProspectDetail from "./pages/ProspectDetail";
import Pipeline from "./pages/Pipeline";
import FollowUps from "./pages/FollowUps";
import Assistant from "./pages/Assistant";
import Import from "./pages/Import";
import Contact from "./pages/Contact";

function AppRoutes() {
  const { company, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-surface flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <p className="mb-4 text-center text-sm text-slate-500">Chargement…</p>
          <WakingNotice />
        </div>
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
          <Route path="/contact" element={<Contact />} />
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

  // Le réveil du serveur démarre dès l'ouverture de la page — donc pendant
  // l'animation d'accueil — et non au moment de la connexion. Tant que
  // l'application reste ouverte, on empêche l'API de se rendormir.
  useEffect(() => {
    warmUp();
    return startKeepAlive();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
