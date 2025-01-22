import { Outlet, useNavigate } from 'react-router';
import useUserStore from '../store/user';
import { useShallow } from 'zustand/shallow';
import { useEffect } from 'react';
import { Skeleton } from '@heroui/react';

const ProtectedRoute = () => {
  const { user, loading } = useUserStore(
    useShallow((store) => ({
      user: store.user,
      loading: store.loading,
    })),
  );

  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user && !loading) {
        navigate('/');
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [loading, navigate, user]);

  return !user && !loading ? (
    <Skeleton className="mx-4 rounded-sm">
      <div className="w-full h-96" />{' '}
    </Skeleton>
  ) : (
    <Outlet />
  );
};

export default ProtectedRoute;
