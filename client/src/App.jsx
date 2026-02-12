import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import HouseSelection from './pages/HouseSelection';
import StartSelection from './pages/StartSelection';
import BuildingPage from './pages/BuildingPage';
import AnnotatePage from './pages/AnnotatePage';
import UnselectedList from './pages/UnselectedList';
import AllList from './pages/AllList';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      >
        <Route path="annotate" element={<AnnotatePage />} />
        <Route path="house-selection" element={<HouseSelection />}>
          <Route index element={<Navigate to="round1/start" replace />} />
          <Route path="round1/start" element={<StartSelection round={1} />} />
          <Route path="round1/building" element={<BuildingPage round={1} />} />
          <Route path="round1/unselected" element={<UnselectedList round={1} />} />
          <Route path="round1/all" element={<AllList round={1} />} />
          <Route path="round2/start" element={<StartSelection round={2} />} />
          <Route path="round2/building" element={<BuildingPage round={2} />} />
          <Route path="round2/unselected" element={<UnselectedList round={2} />} />
          <Route path="round2/all" element={<AllList round={2} />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
