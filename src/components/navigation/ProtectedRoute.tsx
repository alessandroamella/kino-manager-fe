import { Skeleton } from '@heroui/react';
import { useCallback, useEffect, useRef } from 'react';
import {
  createSearchParams,
  Outlet,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { useShallow } from 'zustand/shallow';
import useUserStore from '../../store/user';

const ProtectedRoute = ({
  mustBeAdmin,
  mustBeLoggedIn,
  mustBeLoggedOut,
}: {
  mustBeAdmin?: boolean;
  mustBeLoggedIn?: boolean;
  mustBeLoggedOut?: boolean;
}) => {
  const { user, loading } = useUserStore(
    useShallow((store) => ({
      user: store.user,
      loading: store.loading,
    })),
  );

  const [search] = useSearchParams();

  const navigate = useNavigate();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getShouldRedirect = useCallback(
    () =>
      !loading &&
      (mustBeAdmin
        ? !user || (user && !user.isAdmin)
        : mustBeLoggedIn
        ? !user
        : mustBeLoggedOut
        ? user
        : false),
    [loading, mustBeAdmin, mustBeLoggedIn, mustBeLoggedOut, user],
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!getShouldRedirect()) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (getShouldRedirect()) {
        const path =
          (search.get('to') !== location.pathname && search.get('to')) ||
          ((mustBeLoggedIn || mustBeAdmin) && !user && !loading
            ? {
                pathname: '/auth/login',
                search: createSearchParams({
                  to: search.get('to') || location.pathname,
                  ...Object.fromEntries(search.entries()),
                }).toString(),
              }
            : '/profile');

        console.log(
          `ProtectedRoute redirect to ${path}:\nmustBeAdmin:`,
          mustBeAdmin,
          '\nmustBeLoggedIn:',
          mustBeLoggedIn,
          '\nmustBeLoggedOut:',
          mustBeLoggedOut,
          '\nuser:',
          user,
          '\nloading:',
          loading,
        );
        navigate(path);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current || undefined);
  }, [
    getShouldRedirect,
    loading,
    mustBeAdmin,
    mustBeLoggedIn,
    mustBeLoggedOut,
    navigate,
    search,
    user,
  ]);

  return !user && !mustBeLoggedOut ? (
    <Skeleton>
      <div className="w-full h-96" />
    </Skeleton>
  ) : (
    <>
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
