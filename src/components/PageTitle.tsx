import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

const PageTitle = ({ title }: { title: string }) => {
  const location = useLocation();
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const _title = i18n.exists(`pages.${title}`)
      ? t(`pages.${title}`)
      : i18n.exists(title)
      ? t(title)
      : title;
    document.title = `${_title} | ${t('common.title')}`;
  }, [i18n, location, t, title]);

  return null;
};

export default PageTitle;
