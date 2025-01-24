import { Outlet } from 'react-router';
import useUserStore from './store/user';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroUIProvider } from '@heroui/react';
import useThemeStore from './store/theme';
import { useTheme } from '@heroui/use-theme';
import { ga4Key } from './constants/ga4';
import ReactGA from 'react-ga4';
import { I18nProvider } from '@react-aria/i18n';

ReactGA.initialize(ga4Key);

const App = () => {
  const { i18n } = useTranslation();
  const { setTheme: setHeroUITheme } = useTheme();

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

  useEffect(() => {
    // Set the `lang` attribute on initial render
    document.documentElement.lang = i18n.language;

    console.log('i18n.language:', i18n.language);

    // Listen for language changes and update `lang` dynamically
    const handleLanguageChange = (lang: string) => {
      document.documentElement.lang = lang;
    };

    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup listener on component unmount
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const pageViewSent = useRef(false);
  useEffect(() => {
    if (pageViewSent.current) return;
    pageViewSent.current = true;
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
  }, []);

  const theme = useThemeStore((store) => store.theme);
  useEffect(() => {
    setHeroUITheme(theme);
  }, [setHeroUITheme, theme]);

  return (
    <main className={`${theme} text-foreground bg-background`}>
      {/* en-gb to have dd/mm/yyyy date format instead of US mm/dd/yyyy */}
      <HeroUIProvider locale={i18n.language === 'en' ? 'en-gb' : i18n.language}>
        <I18nProvider locale={i18n.language}>
          <Outlet />
        </I18nProvider>
      </HeroUIProvider>
    </main>
  );
};

export default App;
