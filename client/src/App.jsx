import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import DashboardPage from './pages/DashboardPage';

import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ResumeReviewPage from './pages/ResumeReviewPage';
import ResumeHistoryPage from './pages/ResumeHistoryPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Router>
          <div className="app-wrapper">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<OTPVerificationPage />} />
              
              {/* Add ProtectedRoute logic here later */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
              <Route path="/interview/:id" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
              <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/resume-review" element={<ProtectedRoute><ResumeReviewPage /></ProtectedRoute>} />
              <Route path="/resume-history" element={<ProtectedRoute><ResumeHistoryPage /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;
