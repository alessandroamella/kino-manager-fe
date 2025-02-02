import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n.ts';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { HeroUIProvider } from '@heroui/react';
import Layout from './components/Layout.tsx';
import Homepage from './pages/Homepage.tsx';
import Signup from './pages/auth/Signup.tsx';
import Login from './pages/auth/Login.tsx';
import Profile from './pages/profile/index.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Docs from './components/docs/index.tsx';
import AdminPanel from './pages/admin/index.tsx';
import KinoMenu from './pages/menu/index.tsx';
import CashierRegister from './pages/cashier/index.tsx';
import ForgotPassword from './pages/auth/ForgotPassword.tsx';
import ResetPassword from './pages/auth/ResetPassword.tsx';

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
