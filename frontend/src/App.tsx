import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { DemoPage } from './pages/DemoPage';
import { WorkspacePage } from './pages/WorkspacePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest Interactive Demo Workspace */}
          <Route path="/demo" element={<DemoPage />} />

          {/* Authentication Routes (Public Only - Redirects to /workspace if logged in) */}
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignUpPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Catch-Up Personal Workspace */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
