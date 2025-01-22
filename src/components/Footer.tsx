import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="flex flex-col bg-gray-100 dark:bg-gray-800 py-4 text-center">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* TODO */}
        <p>Social...</p>
        <p>Indirizzo...</p>
      </div>
      <small>
        © {getYear(new Date())} Kinó Café. {t('footer.rights')}
      </small>
    </footer>
  );
};

export default Footer;
