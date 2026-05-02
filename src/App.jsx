import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Clean, authentic imports for your local project
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Services from "./pages/Services";
import Dashboard from "./pages/Dashboard";
import BarangayClearance from "./pages/BarangayClearance";
import IncidentReport from "./pages/IncidentReport";
import BookingPage from './pages/Booking';
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected Route component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Public Route component - redirects authenticated users to dashboard
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          
          {/* Services Route available to everyone */}
          <Route path="/services" element={<Services />} />
          
          {/* Protected Route for Barangay Clearance */}
          <Route path="/request/clearance" element={
            <ProtectedRoute>
              <BarangayClearance />
            </ProtectedRoute>
          } />

          {/* Incident Report Route - Accessible but shows login prompt if not authenticated */}
          <Route path="/incident-report" element={
            <IncidentReport />
          } />
          
          {/* Incident Report Dashboard */}
          <Route path="/incident-report-dashboard" element={
            <div style={{ padding: '100px', textAlign: 'center' }}>
              <h2>Incident Report Dashboard</h2>
              <p>This page is currently under construction by the team.</p>
              <a href="/login">Please Login to File a Report</a>
            </div>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/amenity-reservation" element={<BookingPage />} />
       </Routes>
    </Router>
  );
}

export default App;
