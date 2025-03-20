import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { I18nProvider } from '@react-aria/i18n';
import { useEffect, useMemo, useRef } from 'react';
import ReactGA from 'react-ga4';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { ga4Key } from './constants/ga4';
import useOpeningDatesStore from './store/dates';
import useThemeStore from './store/theme';
import useUserStore from './store/user';

ReactGA.initialize(ga4Key);

const AppProvider = () => {
  const { i18n } = useTranslation();
  const { setTheme: setHeroUITheme } = useTheme();

  const accessToken = useUserStore((store) => store.accessToken);
  const fetchUser = useUserStore((store) => store.fetchUser);

  const isFetching = useRef(false);
  useEffect(() => {
    if (accessToken && !isFetching.current) {
      console.log('Fetching user data from AppProvider');
      isFetching.current = true;
      fetchUser(accessToken).finally(() => {
        isFetching.current = false;
      });
    }
    // don't add user to the dependencies array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchDates = useOpeningDatesStore((store) => store.fetchDates);

  useEffect(() => {
    fetchDates().catch((error) => {
      console.error('Error fetching opening dates:', error);
    });
    // don't add fetchDates to the dependencies array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    console.log('i18n.language:', i18n.language);

    const handleLanguageChange = (lang: string) => {
      document.documentElement.lang = lang;
    };
    i18n.on('languageChanged', handleLanguageChange);
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

  const locale = useMemo(() => {
    // use en-gb for English (for date formatting)
    return i18n.language === 'en' ? 'en-gb' : i18n.language;
  }, [i18n.language]);

  return (
    <main className={`${theme} text-foreground bg-background`}>
      <I18nProvider locale={locale}>
        <HeroUIProvider locale={locale}>
          <ToastProvider />
          <Outlet />
        </HeroUIProvider>
      </I18nProvider>
    </main>
  );
};

export default AppProvider;
