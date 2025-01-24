import { Outlet, useNavigate } from 'react-router';
import useUserStore from '../store/user';
import { useShallow } from 'zustand/shallow';
import { useEffect, useRef } from 'react';
import { Skeleton } from '@heroui/react';

const ProtectedRoute = ({
  mustBeAdmin,
  mustBeLoggedIn,
  mustBeLoggedOut,
  children,
  redirectTo,
}: {
  mustBeAdmin?: boolean;
  mustBeLoggedIn?: boolean;
  mustBeLoggedOut?: boolean;
  children?: React.ReactNode;
  redirectTo?: string;
}) => {
  const { user, loading } = useUserStore(
    useShallow((store) => ({
      user: store.user,
      loading: store.loading,
    })),
  );

  const navigate = useNavigate();

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (
        !loading &&
        (mustBeAdmin
          ? !user || (user && !user.isAdmin)
          : mustBeLoggedIn
          ? !user
          : mustBeLoggedOut
          ? user
          : false)
      ) {
        navigate(redirectTo || '/');
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current || undefined);
  }, [
    loading,
    mustBeAdmin,
    mustBeLoggedIn,
    mustBeLoggedOut,
    navigate,
    redirectTo,
    user,
  ]);

  return !user && !mustBeLoggedOut ? (
    <Skeleton>
      <div className="w-full h-96" />{' '}
    </Skeleton>
  ) : (
    <>
      {children}
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
