import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Interview from './pages/Interview.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Reports from './pages/Reports.jsx';
import ReportDetails from './pages/ReportDetails.jsx';
import { useAuth } from './context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="page center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportDetails /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
