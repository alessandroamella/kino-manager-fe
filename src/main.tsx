import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n.ts';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { HeroUIProvider } from '@heroui/react';
import Layout from './components/layout';
import Homepage from './pages/Homepage';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import Profile from './pages/profile';
import ProtectedRoute from './components/navigation/ProtectedRoute';
import Docs from './components/docs';
import AdminPanel from './pages/admin';
import KinoMenu from './pages/menu';
import CashierRegister from './pages/cashier';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ScanAttendanceQr from './components/attendance/ScanAttendanceQr';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <BrowserRouter>
        <Routes>
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
              <Route index element={<AdminPanel />} />
              <Route path="scan-attendance" element={<ScanAttendanceQr />} />
            </Route>
          </Route>
          <Route path="cashier" element={<ProtectedRoute mustBeAdmin />}>
            <Route index element={<CashierRegister />} />
          </Route>
          <Route path="menu" element={<KinoMenu />} />
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  </StrictMode>,
);
