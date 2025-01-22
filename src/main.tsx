import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n.ts';
import { BrowserRouter, Route, Routes } from 'react-router';
import { HeroUIProvider } from '@heroui/react';
import Layout from './components/Layout.tsx';
import Homepage from './pages/Homepage.tsx';
import Signup from './pages/auth/Signup.tsx';
import Auth from './pages/auth/index.tsx';
import Login from './pages/auth/Login.tsx';
import Profile from './pages/profile/index.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route element={<Homepage />} index />
            <Route path="profile" element={<ProtectedRoute />}>
              <Route index element={<Profile />} />
            </Route>
            <Route path="auth" element={<Auth />}>
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  </StrictMode>,
);
