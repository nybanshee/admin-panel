import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { Logs } from './pages/Logs';
import { Economy } from './pages/Economy';
import { GameSettings } from './pages/GameSettings';
import { Graphs } from './pages/Graphs';
import { PlanningCenter } from './pages/PlanningCenter';
import { Login } from './pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
