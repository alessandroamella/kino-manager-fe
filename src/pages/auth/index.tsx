import { Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';

const Auth = () => {
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 10);
  }, [location.pathname]);

  return (
    <ProtectedRoute mustBeLoggedOut>
      <div className="pt-8 pb-2">
        <Outlet />
      </div>
    </ProtectedRoute>
  );
};

export default Auth;
