import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { FaInstagram, FaTiktok, FaFacebook } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';
import LogoComune from '../../assets/images/logo-comune.png';
import LogoKinoCampus from '../../assets/images/logo-kino-campus.png';
import LogoKinoCafe from '../../assets/images/logo_small.png';
import { Button, Image } from '@heroui/react';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = getYear(new Date());
  const address = 'Via Piave 3, San Cesario sul Panaro, 41018';
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}`;

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid justify-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 space-y-3 px-4 text-center md:text-left">
          {/* Contact & Address */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('footer.contactUs')}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-2">{address}</p>
            <Button
              color="primary"
              onClick={() =>
                window.open(
                  googleMapsDirectionsUrl,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <MdDirections className="mr-2" />
              {t('footer.getDirections')}
            </Button>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('footer.social')}
            </h4>
            <div className="flex justify-center md:justify-start space-x-4">
              <a
                href="https://www.instagram.com/kinocafe_sancesario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTiktok size={24} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaFacebook size={24} />
              </a>
            </div>
          </div>

          {/* Legal & Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('footer.legal')}
            </h4>
            <ul className="text-gray-500 dark:text-gray-400 space-y-2">
              <li>
                <a
                  href="/privacy-policy"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('footer.privacyPolicy')}
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('footer.termsOfService')}
                </a>
              </li>
            </ul>
          </div>

          {/* Logos */}
          <div>
            <div className="grid mt-2 items-center justify-items-center grid-cols-3">
              <div className="w-24 flex justify-center">
                <Image
                  src={LogoKinoCafe}
                  alt="Kino Cafe Logo"
                  className="h-12 w-20 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <a href="https://www.comune.sancesariosulpanaro.mo.it/">
                <Image
                  src={LogoComune}
                  alt="Comune di San Cesario Logo"
                  className="h-12 w-24 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </a>
              <a href="https://www.kinocampus.it/">
                <Image
                  src={LogoKinoCampus}
                  alt="Kino Campus Logo"
                  className="h-12 w-24 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <small className="text-gray-500 dark:text-gray-400">
            © {currentYear} {t('common.title')}. {t('footer.rights')}
          </small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
