import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { FaInstagram, FaTiktok, FaFacebook } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';
import LogoComune from '../../assets/images/logo-comune.png';
import LogoKinoCampus from '../../assets/images/logo-kino-campus.png';
import { Button, Image } from '@heroui/react';
import { Link } from 'react-router';
import { address, googleMapsDirectionsUrl } from '../../constants/address';
import { Email } from 'react-obfuscate-email';
import { contactEmail } from '@/constants/contactEmail';
import { FiMail, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  const { i18n, t } = useTranslation();
  const currentYear = getYear(new Date());

  return (
    <footer className="dark:bg-gradient-to-tl w-full from-yellow-950/40 to-orange-950/40 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid justify-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 space-y-3 px-4 text-center md:text-left">
          {/* Contact & Address */}
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-semibold text-foreground-700 mb-2">
              {t('footer.contactUs')}
            </h4>
            <div>
              <FiMail className="inline-block mr-1 mb-1" />
              <div className="text-foreground-500 hover:text-foreground-700 transition-colors inline">
                <Email email={contactEmail}>{contactEmail}</Email>
              </div>
            </div>
            <p className="mb-2">
              <FiMapPin className="inline-block mr-1" />
              <span className="text-foreground-500">{address}</span>
            </p>
            <Button
              color="primary"
              onPress={() =>
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
            <h4 className="text-lg font-semibold text-foreground-700 mb-2">
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
                href="https://www.tiktok.com/@kin.caf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTiktok size={24} />
              </a>
              <a
                href="https://www.facebook.com/people/Kin%C3%B3-Caf%C3%A9-San-Cesario/61572383012873/"
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
            <h4 className="text-lg font-semibold text-foreground-700 mb-2">
              {t('footer.legal')}
            </h4>
            <ul className="text-foreground-500 space-y-2">
              <li>
                <Link
                  to="/docs/tos"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link
                  to="/docs/privacy"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Logos */}
          <div>
            <div className="grid mt-2 items-center justify-items-center grid-cols-2">
              <a
                href="https://www.comune.sancesariosulpanaro.mo.it/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={LogoComune}
                  alt="Comune di San Cesario Logo"
                  className="h-12 w-24 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </a>
              <a
                href="https://www.kinocampus.it/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-24 flex justify-center"
              >
                <Image
                  src={LogoKinoCampus}
                  alt="Kino Campus Logo"
                  className="h-12 w-full bg-gray-500 p-1 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <small className="text-foreground-500">
            © {currentYear} {t('common.title')}. {t('footer.rights')}
          </small>
          <p className="text-foreground-500 text-small">
            {t('footer.aWebsiteOf')}{' '}
            <a
              href={
                'https://www.bitrey.dev/' +
                (['en', 'it', 'cs'].includes(i18n.language)
                  ? i18n.language
                  : '')
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-700"
            >
              Alessandro Amella
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
