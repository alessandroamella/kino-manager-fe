import { Navigate, Outlet } from 'react-router';
import useUserStore from '../../store/user';

const Auth = () => {
  const user = useUserStore((store) => store.user);

  return user ? <Navigate to="/" /> : <Outlet />;
};

export default Auth;
