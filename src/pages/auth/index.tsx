import { Navigate, Outlet } from 'react-router';
import useUserStore from '../../store/user';
import { useEffect } from 'react';

const Auth = () => {
  const user = useUserStore((store) => store.user);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return user ? <Navigate to="/" /> : <Outlet />;
};

export default Auth;
