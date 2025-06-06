import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import ImageCarousel from '@/components/ui/ImageCarousel';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import useOpeningDatesStore from '@/store/dates';
import {
  Button,
  Calendar,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DateValue,
  Spacer,
} from '@heroui/react';
import { endOfDay, getUnixTime, isBefore, isSameDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { motion } from 'framer-motion';
import { useCallback } from 'react';
import Countdown from 'react-countdown';
import { useTranslation } from 'react-i18next';
import { BiMoviePlay } from 'react-icons/bi';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { GiFilmProjector } from 'react-icons/gi';
import { MdOutlineRestaurantMenu } from 'react-icons/md';
import { Parallax } from 'react-parallax';
import { Link } from 'react-router';
import bg from '../assets/images/homepage-bg.jpg';
import { address, directionsUrl } from '../constants/address';
import useUserStore from '../store/user';
import { dateToCalendarDate } from '../utils/calendar';
import { dateFnsLang } from '../utils/dateFnsLang';
import LoginBtn from './auth/LoginBtn';
import SignupBtn from './auth/SignupBtn';

const Homepage = () => {
  const { t, i18n } = useTranslation();

  const dates = useOpeningDatesStore((store) => store.dates);
  const nextOpeningDate = useOpeningDatesStore(
    (store) => store.nextOpeningDate,
  );
  const getCurrentDate = useOpeningDatesStore((store) => store.getCurrentDate);

  const isDateUnavailable = useCallback(
    (date: DateValue) => {
      return dates
        ? !dates.some((d) => isSameDay(d.openTimeUTC, date.toDate('UTC')))
        : false;
    },
    [dates],
  );

  const user = useUserStore((store) => store.user);

  const renderer = useCallback(
    ({
      days,
      hours,
      minutes,
      seconds,
      completed,
    }: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      completed: boolean;
    }) => {
      if (completed) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative inline-block"
          >
            <span className="text-3xl md:text-4xl font-semibold">
              {t('home.openingNow')}
            </span>
            <motion.div
              className="absolute -bottom-2 left-0 h-1 w-full rounded-full"
              style={{
                background:
                  'linear-gradient(to right, #ff0000, #ff8000, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 0%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear',
              }}
            />
          </motion.div>
        );
      } else {
        return (
          <div className="flex space-x-4 justify-center">
            <div className="countdown-segment">
              <span className="countdown-value">{days}</span>
              <span className="countdown-label">{t('home.days')}</span>
            </div>
            <div className="countdown-segment">
              <span className="countdown-value">{hours}</span>
              <span className="countdown-label">{t('home.hours')}</span>
            </div>
            <div className="countdown-segment">
              <span className="countdown-value">{minutes}</span>
              <span className="countdown-label">{t('home.minutes')}</span>
            </div>
            <div className="countdown-segment">
              <span className="countdown-value">{seconds}</span>
              <span className="countdown-label">{t('home.seconds')}</span>
            </div>
          </div>
        );
      }
    },
    [t],
  );

  const currentDateEpoch = () => 1000 * getUnixTime(getCurrentDate());

  return (
    <>
      <PageTitle title="home" />
      <ScrollTop />
      <main className="relative">
        {/* Hero Section */}
        <section className="text-white py-16 md:py-20 px-4 relative overflow-hidden">
          <div className="container mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('home.kinoCafeTitle')}
            </h1>
            <p className="text-lg md:text-xl mb-4 max-w-2xl mx-auto">
              {t('home.kinoCafeSubtitle')}
            </p>
            <a
              href={directionsUrl}
              className="text-lg mb-8 block text-white hover:text-primary-300 dark:hover:text-primary-600 duration-100 transition-colors max-w-2xl mx-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiMapPin className="inline-block mr-1" />
              {address}
            </a>
            <div className="flex  justify-center space-x-4">
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

          {/* Parallax Background Image */}
          <Parallax
            bgImage={bg}
            bgImageStyle={{
              objectFit: 'cover',
              height: '120%',
            }}
            strength={200}
            style={{
              position: 'absolute',
              inset: 0,
              objectFit: 'cover',
            }}
          >
            {/* This div acts as the background styling layer */}
            <div
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.4,
                backgroundColor: 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(5px)',
              }}
            />
          </Parallax>
        </section>

        {/* Image Carousel Section */}
        <section className="py-8 md:px-4 container mx-auto">
          <div className="mb-6 px-4 md:px-0 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white">
              {t('home.exploreOurSpace')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
              {t('home.exploreOurSpaceSubtitle')}
            </p>
          </div>
          <ImageCarousel className="md:max-w-4xl mx-auto" />
        </section>

        <div
          className={`h-96 bg-gradient-to-br w-full from-purple-950/40 to-primary-600/20 flex items-center justify-center`}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 dark:text-white">
              {t('home.openingCountdownTitle')}
            </h2>
            {nextOpeningDate && (
              <p className="mb-4 text-foreground-600 text-center">
                {formatInTimeZone(
                  nextOpeningDate.openTimeUTC,
                  'Europe/Rome',
                  'EEEE d MMMM yyyy, HH:mm',
                  {
                    locale: dateFnsLang(i18n),
                  },
                )}
              </p>
            )}
            <div className="w-full flex justify-center">
              {nextOpeningDate && currentDateEpoch && (
                <Countdown
                  now={currentDateEpoch}
                  date={nextOpeningDate.openTimeUTC}
                  renderer={renderer}
                />
              )}
            </div>
          </div>
        </div>

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
              <Logo />
            </div>
          </div>
        </section>

        {/* Activities Section */}
        <section className="bg-background-100 py-12 md:pt-20">
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
                    {t('home.openingDay')}
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
              </CardBody>
            </Card>

            <div className="text-center">
              <div className="grid grid-cols-1 gap-8 -my-4 md:grid-cols-2">
                <Calendar
                  isReadOnly
                  isDateUnavailable={isDateUnavailable}
                  aria-label="Date (Read Only)"
                  className="m-auto scale-90 h-fit"
                  value={
                    nextOpeningDate &&
                    dateToCalendarDate(
                      new Date(nextOpeningDate.openTimeUTC.toISOString()),
                    )
                  }
                />

                <div className="flex flex-col gap-8 justify-center">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-gray-800 mt-2 dark:text-gray-100 text-xl font-semibold flex items-center md:justify-start justify-center">
                      <FaCalendarAlt className="mr-1" />{' '}
                      {t('home.openingDates')}
                    </h2>
                    <ul className="text-gray-700 ml-4 list-disc dark:text-gray-300 text-sm text-left">
                      {dates.map((e) => (
                        <li
                          className={cn({
                            'text-kino-700 font-bold':
                              nextOpeningDate &&
                              isSameDay(
                                e.openTimeUTC,
                                nextOpeningDate.openTimeUTC,
                              ),
                            'text-foreground-400': isBefore(
                              endOfDay(e.openTimeUTC),
                              getCurrentDate(),
                            ),
                          })}
                          key={e.id}
                        >
                          {formatInTimeZone(
                            e.openTimeUTC,
                            'Europe/Rome',
                            'EEEE d MMMM yyyy',
                            {
                              locale: dateFnsLang(i18n),
                            },
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-gray-800 dark:text-gray-100 text-xl font-semibold flex items-center md:justify-start justify-center">
                      <FaClock className="mr-1" /> {t('home.openingHours')}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 text-sm flex items-center md:justify-start justify-center">
                      {t('home.openHours')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Spacer y={4} />
          </div>
        </section>
      </main>
    </>
  );
};

export default Homepage;
