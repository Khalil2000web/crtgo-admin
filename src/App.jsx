import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import MfaGate from "./components/MfaGate";
import AppShell from "./components/AppShell";

import AuthPage from "./pages/AuthPage";
import MfaChallengePage from "./pages/MfaChallengePage";

import Dashboard from "./pages/Dashboard";
import WorkspacePage from "./pages/WorkspacePage";
import ProjectGeneralPage from "./pages/ProjectGeneralPage";
import ProjectAppearancePage from "./pages/ProjectAppearancePage";
import ProjectWorkingHoursPage from "./pages/ProjectWorkingHoursPage";
import ProjectLanguagesPage from "./pages/ProjectLanguagesPage";
import MenuEditorPage from "./pages/MenuEditorPage";
import AccountPage from "./pages/AccountPage";
import DesignSystemPage from "./pages/DesignSystemPage";
import WorkspaceOwnershipPage from "./pages/WorkspaceOwnershipPage";
import WorkspaceMembersPage from "./pages/WorkspaceMembersPage";
import WorkspaceAssetHandoffPage from "./pages/WorkspaceAssetHandoffPage";
import WorkspaceBillingHandoffPage from "./pages/WorkspaceBillingHandoffPage";


export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthPage />
        }
      />


      <Route
        element={
          <ProtectedRoute />
        }
      >
        {/* MFA challenge must be authenticated,
            but must NOT sit inside MfaGate. */}
        <Route
          path="/mfa"
          element={
            <MfaChallengePage />
          }
        />


        <Route
          element={
            <MfaGate />
          }
        >
          <Route
            element={
              <AppShell />
            }
          >
            <Route
  path="/workspace/:workspaceId/billing-handoff"
  element={
    <WorkspaceBillingHandoffPage />
  }
/>
            <Route
  path="/workspace/:workspaceId/asset-handoff"
  element={
    <WorkspaceAssetHandoffPage />
  }
/>
            <Route
  path="/workspace/:workspaceId/members"
  element={
    <WorkspaceMembersPage />
  }
/>
            <Route
  path="/workspace/:workspaceId/ownership"
  element={
    <WorkspaceOwnershipPage />
  }
/>
            <Route
              path="/"
              element={
                <Dashboard />
              }
            />


            <Route
              path="/workspace/:workspaceId"
              element={
                <WorkspacePage />
              }
            />


            <Route
              path="/project/:projectId/general"
              element={
                <ProjectGeneralPage />
              }
            />


            <Route
              path="/project/:projectId/menu"
              element={
                <MenuEditorPage />
              }
            />


            <Route
              path="/project/:projectId/appearance"
              element={
                <ProjectAppearancePage />
              }
            />


            <Route
              path="/project/:projectId/hours"
              element={
                <ProjectWorkingHoursPage />
              }
            />


            <Route
              path="/project/:projectId/languages"
              element={
                <ProjectLanguagesPage />
              }
            />


            <Route
              path="/design-system"
              element={
                <DesignSystemPage />
              }
            />


            <Route
              path="/account"
              element={
                <AccountPage />
              }
            />
          </Route>
        </Route>
      </Route>


      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}