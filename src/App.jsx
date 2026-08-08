import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProjectGeneralPage from "./pages/ProjectGeneralPage";
import ProjectAppearancePage from "./pages/ProjectAppearancePage";
import ProjectWorkingHoursPage from "./pages/ProjectWorkingHoursPage";
import MenuEditorPage from "./pages/MenuEditorPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/project/:projectId/general"
            element={<ProjectGeneralPage />}
          />

          <Route
            path="/project/:projectId/menu"
            element={<MenuEditorPage />}
          />

          <Route
            path="/project/:projectId/appearance"
            element={<ProjectAppearancePage />}
          />

          <Route
            path="/project/:projectId/hours"
            element={<ProjectWorkingHoursPage />}
          />

          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}