import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import GradeSimulator from './pages/GradeSimulator';
import Homework from './pages/Homework';
import Timetable from './pages/Timetable';
import SchoolLife from './pages/SchoolLife';
import AIAssistant from './pages/AIAssistant';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import LoadingScreen from './components/layout/LoadingScreen';

function App() {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      await checkAuthStatus();
      setIsChecking(false);
    };

    initializeApp();
  }, [checkAuthStatus]);

  if (isChecking || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
        
        <Routes>
          <Route path="/login" element={
            !isAuthenticated ? <Login /> : <Navigate to="/" replace />
          } />
          
          <Route path="/" element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
          }>
            <Route index element={<Dashboard />} />
            <Route path="grades" element={<Grades />} />
            <Route path="grades/simulator" element={<GradeSimulator />} />
            <Route path="homework" element={<Homework />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="school-life" element={<SchoolLife />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="goals" element={<Goals />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;