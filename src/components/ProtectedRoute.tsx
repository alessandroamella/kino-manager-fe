import {
  createSearchParams,
  Outlet,
  useNavigate,
  useSearchParams,
} from 'react-router';
import useUserStore from '../store/user';
import { useShallow } from 'zustand/shallow';
import { useCallback, useEffect, useRef } from 'react';
import { Skeleton } from '@heroui/react';

const ProtectedRoute = ({
  mustBeAdmin,
  mustBeLoggedIn,
  mustBeLoggedOut,
}: {
  mustBeAdmin?: boolean;
  mustBeLoggedIn?: boolean;
  mustBeLoggedOut?: boolean;
}) => {
  const { user, fetchUser, accessToken, loading } = useUserStore(
    useShallow((store) => ({
      user: store.user,
      fetchUser: store.fetchUser,
      accessToken: store.accessToken,
      loading: store.loading,
    })),
  );

  const isFetching = useRef(false);
  useEffect(() => {
    if (!isFetching.current && !user && accessToken && !loading) {
      isFetching.current = true;
      fetchUser(accessToken);
    }
  }, [accessToken, fetchUser, loading, user]);

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
        console.log(
          'ProtectedRoute redirect:\nmustBeAdmin:',
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
        navigate(
          (search.get('to') !== location.pathname && search.get('to')) ||
            (mustBeLoggedIn
              ? {
                  pathname: '/auth/login',
                  search: createSearchParams({
                    to: search.get('to') || location.pathname,
                  }).toString(),
                }
              : '/profile'),
        );
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
      <div className="w-full h-96" />{' '}
    </Skeleton>
  ) : (
    <>
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
