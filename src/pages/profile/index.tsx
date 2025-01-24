import {
  Card,
  CardBody,
  CardHeader,
  Code,
  Tooltip,
  Skeleton,
  Divider,
  Avatar,
  Alert,
  Chip,
} from '@heroui/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import useUserStore from '../../store/user';
import {
  FiMail,
  FiCalendar,
  FiMapPin,
  FiCheckCircle,
  FiAlertTriangle,
  FiCode,
  FiPhone,
  FiHome,
  FiFileText,
  FiClock,
} from 'react-icons/fi';
import { dateFnsLang } from '../../utils/dateFnsLang';
import { BiTime } from 'react-icons/bi';
import useIsMobile from '../../utils/isMobile';

const Profile = () => {
  const { t, i18n } = useTranslation();

  const user = useUserStore((store) => store.user);

  const isMobile = useIsMobile();

  return (
    <div className="mx-auto py-3 bg-background-50 -mt-6 md:mt-0 md:p-6 md:px-12 lg:px-16 xl:px-24">
      <Card shadow={isMobile ? 'none' : undefined}>
        <CardHeader className="flex justify-between items-center px-4 md:px-6 py-3 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('profile.myProfile')}
          </h2>
        </CardHeader>
        {user ? (
          <CardBody className="px-4 pt-4 pb-6">
            {!user.verificationMethod && ( // Changed condition to check verificationMethod existence
              <div className="w-full flex items-center">
                <Alert color="warning" title={t('profile.verifyAccount')}>
                  <p className="text-small">
                    {t('profile.verifyAccountDescription')}
                  </p>
                </Alert>
              </div>
            )}
            <div className="flex items-center space-x-4 my-6 mx-auto">
              <Avatar
                size="lg"
                src={`https://gravatar.com/avatar/${user.emailHash}`}
              />
              <div>
                <h3 className="text-xl font-bold flex items-center gap-1 text-gray-900 dark:text-white">
                  <span>
                    {user.firstName} {user.lastName}
                  </span>

                  <Tooltip
                    showArrow
                    content={t(
                      user.verificationDate
                        ? 'profile.memberSinceDate'
                        : 'profile.toBeVerified',
                      {
                        date:
                          user.verificationDate &&
                          format(user.verificationDate, 'dd MMMM yyyy', {
                            locale: dateFnsLang(i18n),
                          }),
                      },
                    )}
                  >
                    <div>
                      {user.membershipCardNumber ? (
                        <Chip color="primary" variant="flat" className="ml-1">
                          {t('profile.card', { n: user.membershipCardNumber })}
                        </Chip>
                      ) : (
                        <BiTime style={{ color: 'grey' }} />
                      )}
                    </div>
                  </Tooltip>
                </h3>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <Divider className="mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-8 lg:px-12">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiMail className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.email')}:
                  </span>
                </div>
                <p className="text-foreground-500">{user.email}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiPhone className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.phoneNumber')}:
                  </span>
                </div>
                <p className="text-foreground-500">{user.phoneNumber}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiHome className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.address')}:
                  </span>
                </div>
                <p className="text-foreground-500">{user.address}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiMapPin className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.birthComune')}:
                  </span>
                </div>
                <p className="text-foreground-500">{user.birthComune || '-'}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiCalendar className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.birthDate')}:
                  </span>
                </div>
                <p className="text-foreground-500">
                  {format(user.birthDate, 'dd MMMM yyyy', {
                    locale: dateFnsLang(i18n),
                  }) || '-'}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiMapPin className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.birthCountry')}:
                  </span>
                </div>
                <p className="text-foreground-500">
                  {t(`countries.${user.birthCountry}`) || '-'}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiCode className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.codiceFiscale')}:
                  </span>
                </div>
                <Code size="md">{user.codiceFiscale || '-'}</Code>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiCalendar className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.memberSince')}:
                  </span>
                </div>
                <p className="text-foreground-500">
                  {format(new Date(user.createdAt), 'dd MMMM yyyy', {
                    locale: dateFnsLang(i18n),
                  })}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiFileText className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.documentInfo')}:
                  </span>
                </div>
                <p className="text-small text-foreground-500">
                  {!user.documentType && '-'}
                  {user.documentType && t(`document.${user.documentType}`)}
                  {user.documentNumber && <br />}
                  {user.documentNumber ? user.documentNumber : ''}
                  {user.documentExpiry && <br />}
                  {user.documentExpiry
                    ? `${t('profile.expiry')}: ${format(
                        user.documentExpiry,
                        'dd MMMM yyyy',
                        {
                          locale: dateFnsLang(i18n),
                        },
                      )}`
                    : ''}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiClock className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.verificationStatus')}:
                  </span>
                </div>
                <div>
                  {user.verificationMethod ? (
                    <Tooltip
                      content={`${t('profile.verifiedVia')} ${t(
                        'verificationMethod.' + user.verificationMethod,
                      )} on ${format(
                        user.verificationDate!,
                        'dd MMMM yyyy HH:mm',
                        {
                          locale: dateFnsLang(i18n),
                        },
                      )}`}
                    >
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<FiCheckCircle className="mx-[2px]" />}
                      >
                        {t('profile.verified')}
                      </Chip>
                    </Tooltip>
                  ) : (
                    <Chip
                      size="sm"
                      color="warning"
                      variant="flat"
                      startContent={<FiAlertTriangle className="mx-[2px]" />}
                    >
                      {t('profile.notVerified')}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        ) : (
          <CardBody className="px-4 py-4">
            <Skeleton className="rounded-md">
              <div className="h-48 w-full" />
            </Skeleton>
          </CardBody>
        )}
      </Card>
    </div>
  );
};

export default Profile;
