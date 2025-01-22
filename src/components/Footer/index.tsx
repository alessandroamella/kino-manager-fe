import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="flex flex-col gap-6 bg-gray-100 dark:bg-gray-800 py-4 text-center">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <p className="text-white w-52 text-center mx-auto font-medium text-wrap bg-red-500">
          TODO: metti link social
        </p>
        <p className="text-white w-52 text-center mx-auto font-medium text-wrap bg-red-500">
          TODO: metti indirizzo (link per Maps)
        </p>
      </div>
      <small>
        © {getYear(new Date())} {t('common.title')}.
        <p className="text-white inline-block ml-2 text-center mx-auto font-medium text-wrap bg-red-500">
          TODO: metti t(&apos;footer.rights&apos;)
        </p>
      </small>
    </footer>
  );
};

export default Footer;
