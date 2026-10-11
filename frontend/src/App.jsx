import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Profile } from './pages/profile/Profile';
import { ResumeManagement } from './pages/resume/ResumeManagement';
import { JobAnalysis } from './pages/jobAnalysis/JobAnalysis';
import { RoadmapOverview } from './pages/roadmap/RoadmapOverview';
import { ModuleDetail } from './pages/roadmap/ModuleDetail';
import { AssessmentView } from './pages/assessment/AssessmentView';
import { AssessmentHistory } from './pages/assessment/AssessmentHistory';

function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Workspace */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/resumes" element={<ResumeManagement />} />
              <Route path="/job-analysis" element={<JobAnalysis />} />
              <Route path="/roadmaps" element={<RoadmapOverview />} />
              <Route path="/roadmaps/:roadmapId/module/:moduleId" element={<ModuleDetail />} />
              <Route path="/assessments" element={<Navigate to="/assessments/history" replace />} />
              <Route path="/assessments/history" element={<AssessmentHistory />} />
              <Route path="/assessments/:roadmapId/:moduleId" element={<AssessmentView />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;
