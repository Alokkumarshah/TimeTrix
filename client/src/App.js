import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import Faculty from './pages/Faculty';
import Subjects from './pages/Subjects';
import Classrooms from './pages/Classrooms';
import Constraints from './pages/Constraints';
import SpecialClasses from './pages/SpecialClasses';
import Timetable from './pages/Timetable';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/batches" element={
                <ProtectedRoute>
                  <Layout>
                    <Batches />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/faculty" element={
                <ProtectedRoute>
                  <Layout>
                    <Faculty />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/subjects" element={
                <ProtectedRoute>
                  <Layout>
                    <Subjects />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/classrooms" element={
                <ProtectedRoute>
                  <Layout>
                    <Classrooms />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/constraints" element={
                <ProtectedRoute>
                  <Layout>
                    <Constraints />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/special-classes" element={
                <ProtectedRoute>
                  <Layout>
                    <SpecialClasses />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/timetable" element={
                <ProtectedRoute>
                  <Layout>
                    <Timetable />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
