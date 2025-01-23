import {
  Button,
  Calendar,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Image,
  Spacer,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/images/logo.png';
import logoDark from '../assets/images/logo-dark.png';
import { FaClock, FaCalendarAlt } from 'react-icons/fa';
import { GiFilmProjector } from 'react-icons/gi';
import { MdOutlineRestaurantMenu } from 'react-icons/md';
import { BiMoviePlay } from 'react-icons/bi';
import LoginBtn from './auth/LoginBtn';
import SignupBtn from './auth/SignupBtn';
import { dateToCalendarDate } from '../utils/calendar';
import { format, parse } from 'date-fns';
import { dateFnsLang } from '../utils/dateFnsLang';
import useUserStore from '../store/user';
import { Link } from 'react-router';
import { FiArrowRight } from 'react-icons/fi';
import bg from '../assets/images/homepage-bg.jpg';

const openingDate = parse('2025-01-05', 'yyyy-MM-dd', new Date());

const Homepage = () => {
  const { t, i18n } = useTranslation();

  const user = useUserStore((store) => store.user);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-400 to-primary-600 text-white py-16 md:py-24 px-4 md:mt-12 relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('home.kinoCafeTitle')}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {t('home.kinoCafeSubtitle')}
          </p>
          <div className="flex justify-center space-x-4">
            {user ? (
              <Button
                as={Link}
                to="/profile"
                variant="bordered"
                className="flex items-center justify-center"
              >
                <FiArrowRight className="text-white inline-block" />
                <span className="text-white">{t('home.goToMyProfile')}</span>
              </Button>
            ) : (
              <>
                <SignupBtn />
                <LoginBtn className="fill-white border-gray-200 dark:border-inherit" />
              </>
            )}
          </div>
        </div>
        {/* Background image with subtle blur */}
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center blur-sm"
          style={{
            backgroundImage: `url(${bg})`,
          }}
        />
      </section>

      {/* About Us Section */}
      <section className="bg-foreground-50 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-gray-800 dark:text-gray-100 space-y-4">
            <h2 className="text-3xl font-semibold mb-4">
              <MdOutlineRestaurantMenu className="mr-2 inline-block text-primary-500" />
              {/* Icon for About Us */}
              {t('home.aboutUsTitle')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('home.aboutUsText1')}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('home.aboutUsText2')}
            </p>
            {/* Placeholder for additional about us images, if needed */}
            {/* <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="aspect-w-16 aspect-h-9">
                  <Image src="/path-to-another-about-us-image.jpg" alt="Another view of Kinó Café" className="object-cover rounded-md shadow-md" />
                </div>
                <div className="aspect-w-16 aspect-h-9">
                  <Image src="/path-to-yet-another-image.jpg" alt="Kinó Café ambiance" className="object-cover rounded-md shadow-md" />
                </div>
              </div> */}
          </div>
          <div className="relative rounded-md shadow-md overflow-hidden">
            <Image
              src={logo}
              alt="Kinó Café Interior"
              isZoomed
              className="dark:hidden object-cover w-full h-full"
            />
            <Image
              src={logoDark}
              alt="Kinó Café Interior"
              isZoomed
              className="hidden dark:block object-cover w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="bg-background dark:bg-gray-800 py-12 md:pt-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-semibold text-center text-gray-800 dark:text-white mb-8">
            <GiFilmProjector className="inline-block mr-2 text-primary-500" />
            {/* Icon for Activities */}
            {t('home.activitiesTitle')}
          </h2>

          {/* "Blande" Activities */}
          <Card className="mb-8 p-3 xs:p-4">
            <CardHeader className="flex items-center">
              <BiMoviePlay className="mr-2 text-xl" />
              {/* Icon for Blande Activities */}
              <p className="text-lg font-medium">
                {t('home.blandeActivitiesTitle')}

                <Chip className="ml-2" color="primary">
                  {t('home.starting', {
                    date: format(openingDate, 'EEE d MMM', {
                      locale: dateFnsLang(i18n),
                    }),
                  })}
                </Chip>
              </p>
            </CardHeader>
            <CardBody className="space-y-2">
              <p>{t('home.blandeActivitiesText1')}</p>
              <ul className="list-disc pl-6">
                <li>{t('home.blandeActivitiesItem1')}</li>
                <li>{t('home.blandeActivitiesItem2')}</li>
                <li>{t('home.blandeActivitiesItem3')}</li>
                <li>{t('home.blandeActivitiesItem4')}</li>
              </ul>

              <p>{t('home.blandeActivitiesText2')}</p>
              {/* Placeholder for image related to "Blande" activities */}
              {/* <div className="mt-4 aspect-w-16 aspect-h-9">
                <Image src="/path-to-blande-activities-image.jpg" alt="Blande Activities" className="object-cover rounded-md shadow-md" />
              </div> */}
            </CardBody>
          </Card>

          {/* "Serie" Activities */}
          <Card className="mb-8 p-3 xs:p-4">
            <CardHeader className="flex items-center">
              <BiMoviePlay className="mr-2 text-xl" />
              {/* Icon for Serie Activities */}
              <p className="text-lg font-medium">
                {t('home.serieActivitiesTitle')}

                <Chip className="ml-2" color="default">
                  {t('home.dateToBeDefined')}
                </Chip>
              </p>
            </CardHeader>
            <CardBody className="space-y-2">
              <p>{t('home.serieActivitiesText1')}</p>
              <ul className="list-disc pl-6">
                <li>{t('home.serieActivitiesItem1')}</li>
                <li>{t('home.serieActivitiesItem2')}</li>
                <li>{t('home.serieActivitiesItem3')}</li>
              </ul>
              {/* Placeholder for image related to "Serie" activities */}
              {/* <div className="mt-4 aspect-w-16 aspect-h-9">
                <Image src="/path-to-serie-activities-image.jpg" alt="Serie Activities" className="object-cover rounded-md shadow-md" />
              </div> */}
            </CardBody>
          </Card>

          {/* Library section */}
          {/* <Card className="mb-8">
            <CardHeader className="flex items-center">
              <MdOutlineLocalLibrary className="mr-2 text-xl" />
              <p className="text-lg font-medium">{t('home.libraryTitle')}</p>
            </CardHeader>
            <CardBody>
              <p>{t('home.libraryText1')}</p>
            </CardBody>
          </Card> */}

          <div className="text-center">
            <div className="grid grid-cols-1 gap-8 -my-4 md:grid-cols-2">
              <Calendar
                isReadOnly
                aria-label="Date (Read Only)"
                className="mx-auto scale-90"
                value={dateToCalendarDate(openingDate)}
              />

              <div className="flex flex-col gap-8 justify-center">
                <div className="flex flex-col gap-2">
                  <h2 className="text-gray-800 dark:text-gray-100 text-xl font-semibold flex items-center md:justify-start justify-center">
                    <FaCalendarAlt className="mr-1" /> {t('home.openingDate')}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 text-sm flex items-center md:justify-start justify-center">
                    {format(openingDate, 'EEEE d MMMM yyyy', {
                      locale: dateFnsLang(i18n),
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-gray-800 dark:text-gray-100 text-xl font-semibold flex items-center md:justify-start justify-center">
                    <FaClock className="mr-1" /> {t('home.openingHours')}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 text-sm flex items-center md:justify-start justify-center">
                    {t('home.openDays')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Spacer y={4} />
        </div>
      </section>
    </div>
  );
};

export default Homepage;
