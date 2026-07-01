import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import BusinessPage from "./pages/BusinessPage";
import MenuEditorPage from "./pages/MenuEditorPage";
import BranchGeneralPage from "./pages/BranchGeneralPage";
import BranchAppearancePage from "./pages/BranchAppearancePage";
import BranchWorkingHoursPage from "./pages/BranchWorkingHoursPage";
import BranchLanguagesPage from "./pages/BranchLanguagesPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/business/:businessId" element={<BusinessPage />} />

          <Route path="/branch/:branchId/general" element={<BranchGeneralPage />} />
          <Route path="/branch/:branchId/menu" element={<MenuEditorPage />} />
          <Route path="/branch/:branchId/appearance" element={<BranchAppearancePage />} />
          <Route path="/branch/:branchId/hours" element={<BranchWorkingHoursPage />} />
          <Route path="/branch/:branchId/languages" element={<BranchLanguagesPage />} />

          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}