import { Spinner } from '@heroui/react';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import AppProvider from './AppProvider.tsx';
import Docs from './components/docs';
import Layout from './components/layout';
import ProtectedRoute from './components/navigation/ProtectedRoute';
import './i18n.ts';
import './index.css';
import Homepage from './pages/Homepage';
import ForgotPassword from './pages/auth/ForgotPassword';
import Login from './pages/auth/Login';
import ResetPassword from './pages/auth/ResetPassword';
import Signup from './pages/auth/Signup';
import KinoMenu from './pages/menu';
import Profile from './pages/profile';

// Dynamically import admin components
const AdminPanel = lazy(() => import('./pages/admin'));
const CashierRegister = lazy(() => import('./pages/cashier'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<Spinner />}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppProvider />}>
            <Route element={<Layout />}>
              <Route element={<Homepage />} index />
              <Route path="profile" element={<ProtectedRoute mustBeLoggedIn />}>
                <Route index element={<Profile />} />
              </Route>
              <Route path="auth" element={<ProtectedRoute mustBeLoggedOut />}>
                <Route index element={<Navigate to="/auth/login" />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
              </Route>
              <Route path="docs">
                <Route index element={<Navigate to="/" />} />
                <Route path=":id" element={<Docs />} />
              </Route>
              <Route path="admin" element={<ProtectedRoute mustBeAdmin />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<Spinner />}>
                      <AdminPanel />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
            <Route path="cashier" element={<ProtectedRoute mustBeAdmin />}>
              <Route
                index
                element={
                  <Suspense fallback={<Spinner />}>
                    <CashierRegister />
                  </Suspense>
                }
              />
            </Route>
            <Route path="menu" element={<KinoMenu />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  </StrictMode>,
);
