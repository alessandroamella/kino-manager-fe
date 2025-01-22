import { useTheme } from '@heroui/use-theme';
import { Outlet } from 'react-router';
import useUserStore from './store/user';
import { useEffect, useRef } from 'react';

const App = () => {
  const { theme } = useTheme();
  const accessToken = useUserStore((store) => store.accessToken);
  const fetchUser = useUserStore((store) => store.fetchUser);

  const isFetching = useRef(false);
  useEffect(() => {
    if (accessToken && !isFetching.current) {
      isFetching.current = true;
      console.log('useEffect: Fetching user...');
      fetchUser(accessToken).finally(() => {
        isFetching.current = false;
      });
    } else {
      console.log('useEffect: No access token');
    }
    // don't add user to the dependencies array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <main className={`${theme} text-foreground bg-background`}>
      <Outlet />
    </main>
  );
};

export default App;
