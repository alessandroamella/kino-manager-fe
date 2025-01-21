import { useTranslation } from 'react-i18next';

const Homepage = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-8">
      <p>{t('home.hi')}</p>
    </div>
  );
};

export default Homepage;
