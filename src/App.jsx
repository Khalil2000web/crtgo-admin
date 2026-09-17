import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import BillingPage from "./pages/BillingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
