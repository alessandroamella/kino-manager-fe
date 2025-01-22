import { useTheme } from '@heroui/use-theme';
import { Outlet } from 'react-router';
import useUserStore from './store/user';
import { useEffect } from 'react';

const App = () => {
  const { theme } = useTheme();
  const accessToken = useUserStore((store) => store.accessToken);
  const fetchUser = useUserStore((store) => store.fetchUser);

  useEffect(() => {
    if (accessToken) {
      console.log('useEffect: Fetching user...');
      fetchUser(accessToken);
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
