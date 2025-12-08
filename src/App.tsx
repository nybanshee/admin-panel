import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { Logs } from './pages/Logs';
import { Economy } from './pages/Economy';
import { GameSettings } from './pages/GameSettings';
import { Graphs } from './pages/Graphs';
import { PlanningCenter } from './pages/PlanningCenter';
import { Login } from './pages/Login';
import { WorkspaceSelection } from './pages/WorkspaceSelection';
import { PanelSettings } from './pages/PanelSettings';
import { PersonalSettings } from './pages/PersonalSettings';
import { useAuthStore } from './store/auth';
import { CustomCursor, ReactiveBackground, FloatingParticles } from './components/CursorAndBackground';

const ProtectedRoute = ({ children, requireWorkspace = true }: { children: React.ReactNode, requireWorkspace?: boolean }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const workspace = useAuthStore(s => s.workspace);
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireWorkspace && !workspace) return <Navigate to="/workspace" replace />;
  
  return <>{children}</>;
};

function App() {
  const syncSystemRoles = useAuthStore(s => s.syncSystemRoles);

  useEffect(() => {
    syncSystemRoles();
  }, [syncSystemRoles]);

  return (
    <BrowserRouter>
      <CustomCursor />
      <ReactiveBackground />
      <FloatingParticles />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/workspace" element={
            <ProtectedRoute requireWorkspace={false}>
                <WorkspaceSelection />
            </ProtectedRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Overview />} />
          <Route path="logs" element={<Logs />} />
          <Route path="economy" element={<Economy />} />
          <Route path="settings" element={<GameSettings />} />
          <Route path="graphs" element={<Graphs />} />
          <Route path="planning" element={<PlanningCenter />} />
          <Route path="admin" element={<PanelSettings />} />
          <Route path="personal" element={<PersonalSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
