import { Outlet } from 'react-router';
import useUserStore from './store/user';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroUIProvider } from '@heroui/react';
import useThemeStore from './store/theme';
import { useTheme } from '@heroui/use-theme';
import { ga4Key } from './constants/ga4';
import ReactGA from 'react-ga4';

ReactGA.initialize(ga4Key);

const App = () => {
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

  const pageViewSent = useRef(false);
  useEffect(() => {
    if (pageViewSent.current) return;
    pageViewSent.current = true;
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
  }, []);

  const { i18n } = useTranslation();

  const { setTheme: setHeroUITheme } = useTheme();

  const theme = useThemeStore((store) => store.theme);
  useEffect(() => {
    setHeroUITheme(theme);
  }, [setHeroUITheme, theme]);

  return (
    <main className={`${theme} text-foreground bg-background my-6`}>
      <HeroUIProvider locale={i18n.language}>
        <Outlet />
      </HeroUIProvider>
    </main>
  );
};

export default App;
