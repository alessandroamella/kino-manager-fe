import { Navigate, Outlet, useLocation } from 'react-router';
import useUserStore from '../../store/user';
import { useEffect } from 'react';

const Auth = () => {
  const user = useUserStore((store) => store.user);

  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 10);
  }, [location.pathname]);

  return user ? <Navigate to="/" /> : <Outlet />;
};

export default Auth;
