import {
  Card,
  CardBody,
  CardHeader,
  Code,
  Skeleton,
  Divider,
  Avatar,
  Chip,
  Tooltip,
  Alert,
  Button,
} from '@heroui/react';
import { format, isToday } from 'date-fns';
import { useTranslation } from 'react-i18next';
import useUserStore from '../../store/user';
import {
  FiMail,
  FiCalendar,
  FiMapPin,
  FiCode,
  FiPhone,
  FiHome,
} from 'react-icons/fi';
import { dateFnsLang } from '../../utils/dateFnsLang';
import { BiTime } from 'react-icons/bi';
import useIsMobile from '../../utils/isMobile';
import parsePhoneNumber from 'libphonenumber-js';
import { useCallback, useMemo, useState } from 'react';
import { hasFlag } from 'country-flag-icons';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { FaIdCard } from 'react-icons/fa';
import axios from 'axios';
import { getErrorMsg } from '@/types/error';
import { AiOutlineSignature } from 'react-icons/ai';
import SignatureModal from '@/components/input/SignatureModal';
import PageTitle from '@/components/PageTitle';
import ScrollTop from '@/components/ScrollTop';

const Profile = () => {
  const { t, i18n } = useTranslation();

  const user = useUserStore((store) => store.user);
  const fetchUser = useUserStore((store) => store.fetchUser);
  const token = useUserStore((store) => store.accessToken);

  const isMobile = useIsMobile();

  const [phoneCountry, phoneFormatted] = useMemo(() => {
    const parsed = parsePhoneNumber(user?.phoneNumber || '-');
    if (!parsed?.isValid()) {
      return [null, null];
    }

    const formatted =
      parsed.country === 'IT'
        ? parsed.formatNational()
        : parsed.formatInternational();
    return [parsed.country, formatted];
  }, [user]);

  const [signatureError, setSignatureError] = useState<string | null>(null);

  const addSignature = useCallback(
    async (signatureB64: string | null) => {
      if (!token) {
        console.error('No token provided to addSignature');
        setSignatureError('No token provided to addSignature');
        return;
      } else if (!signatureB64) {
        console.warn('No signature provided to addSignature');
        return;
      }
      try {
        await axios.post(
          '/v1/member/signature',
          { signatureB64 },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        await fetchUser(token); // Refresh user data
      } catch (err) {
        console.error('Error adding signature:', getErrorMsg(err));
        setSignatureError(getErrorMsg(err));
      }
    },
    [fetchUser, token],
  );

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  return (
    <>
      <SignatureModal
        isOpen={isSignatureModalOpen}
        setIsOpen={setIsSignatureModalOpen}
        onSaveSignature={addSignature}
      />
      <PageTitle title="profile" />
      <ScrollTop />
      <main className="mx-auto py-6 bg-background-50 -mt-2 md:mt-0 md:p-6 md:px-12 lg:px-16 xl:px-24">
        <Card shadow={isMobile ? 'none' : undefined}>
          <CardHeader className="flex justify-between items-center px-4 md:px-6 py-3 border-b-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('profile.myProfile')}
            </h2>
          </CardHeader>
          {user ? (
            <CardBody className="px-4 py-4">
              {token && !user.signatureR2Key && (
                <Alert
                  className="mb-2"
                  color={signatureError ? 'danger' : 'warning'}
                  title={t(
                    signatureError ? 'errors.error' : 'profile.noSignature',
                  )}
                >
                  {signatureError || t('profile.noSignatureMessage')} ✍️
                  <Button
                    onPress={() => setIsSignatureModalOpen(true)}
                    className="mt-4 mb-1 mx-auto"
                    color="secondary"
                    size="lg"
                  >
                    <AiOutlineSignature /> {t('profile.addSignature')}
                  </Button>
                </Alert>
              )}
              <div className="flex items-center space-x-4 mt-2 mb-6 mx-auto">
                <Avatar
                  size="lg"
                  src={`https://gravatar.com/avatar/${user.emailHash}`}
                />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-1 text-gray-900 dark:text-white">
                    <span>
                      {user.firstName} {user.lastName}
                    </span>

                    <div>
                      {user.membershipCardNumber ? (
                        <Chip color="primary" variant="flat" className="ml-1">
                          #{user.membershipCardNumber}
                        </Chip>
                      ) : (
                        <Tooltip content={t('profile.noCardAssigned')}>
                          <div>
                            <BiTime style={{ color: 'grey' }} />
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
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
                  <p className="text-foreground-500">
                    {phoneCountry && hasFlag(phoneCountry) && (
                      <span className="mr-2">
                        {getUnicodeFlagIcon(phoneCountry)}
                      </span>
                    )}
                    {phoneFormatted}
                  </p>
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
                  <p className="text-foreground-500">
                    {user.birthComune || '-'}
                  </p>
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
                    {isToday(user.birthDate) && ' 🎂🥳'}
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
                    {hasFlag(user.birthCountry) && (
                      <span className="mr-2">
                        {getUnicodeFlagIcon(user.birthCountry)}
                      </span>
                    )}
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
                    <FaIdCard className="text-gray-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {t('profile.membershipCardNumber')}:
                    </span>
                  </div>
                  <p className="text-foreground-500">
                    {user.membershipCardNumber
                      ? t('profile.card', { n: user.membershipCardNumber })
                      : t('profile.notAMember')}
                  </p>
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
      </main>
    </>
  );
};

export default Profile;
