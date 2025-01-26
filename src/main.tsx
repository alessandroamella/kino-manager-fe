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
import AdminPurchases from './pages/admin/AdminPurchases.tsx';

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
            </Route>
            <Route path="docs">
              <Route index element={<Navigate to="/" />} />
              <Route path=":id" element={<Docs />} />
            </Route>
            <Route path="admin" element={<ProtectedRoute mustBeAdmin />}>
              <Route index element={<AdminPanel />} />
              <Route path="purchases" element={<AdminPurchases />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  </StrictMode>,
);
