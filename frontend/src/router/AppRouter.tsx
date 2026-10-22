import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage';
import { NewApplicationWizardPage } from '../pages/client/NewApplicationWizardPage';
import { ApplicationDetailsPage } from '../pages/client/ApplicationDetailsPage';
import { AnalystQueuePage } from '../pages/analyst/AnalystQueuePage';
import { AnalystReviewPage } from '../pages/analyst/AnalystReviewPage';
import { StateMachineVisualizerPage } from '../pages/dev/StateMachineVisualizerPage';

const RootRedirect: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'BankEmployee' ? '/analyst/queue' : '/client/dashboard'} replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary fallbackTitle="Ошибка в приложении">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<RootRedirect />} />

            {/* Client Routes */}
            <Route element={<ProtectedRoute requiredRole="Client" />}>
              <Route path="/client/dashboard" element={<ClientDashboardPage />} />
              <Route path="/client/new" element={<NewApplicationWizardPage />} />
              <Route path="/client/applications/:id" element={<ApplicationDetailsPage />} />
            </Route>

            {/* Analyst Routes */}
            <Route element={<ProtectedRoute requiredRole="BankEmployee" />}>
              <Route path="/analyst/queue" element={<AnalystQueuePage />} />
              <Route path="/analyst/review/:id" element={<AnalystReviewPage />} />
            </Route>

            {/* State Machine Specification & Dev Tool */}
            <Route path="/dev/state-machine" element={<StateMachineVisualizerPage />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
