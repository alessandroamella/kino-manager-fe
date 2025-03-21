import AttendanceQr from '@/components/attendance/AttendanceQr';
import SignatureModal from '@/components/input/SignatureModal';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import { getErrorMsg } from '@/types/error';
import {
  addToast,
  Alert,
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Code,
  Divider,
  Skeleton,
  Tooltip,
} from '@heroui/react';
import axios from 'axios';
import { hasFlag } from 'country-flag-icons';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { format, isToday } from 'date-fns';
import parsePhoneNumber from 'libphonenumber-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLogout, AiOutlineSignature } from 'react-icons/ai';
import { BiTime } from 'react-icons/bi';
import {
  FiCalendar,
  FiCode,
  FiCreditCard,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
} from 'react-icons/fi';
import { useLocation } from 'react-router';
import useUserStore from '../../store/user';
import { dateFnsLang } from '../../utils/dateFnsLang';
import useIsMobile from '../../utils/isMobile';

const Profile = () => {
  const { t, i18n } = useTranslation();

  const user = useUserStore((store) => store.user);
  const logout = useUserStore((store) => store.logout);
  const fetchUser = useUserStore((store) => store.fetchUser);
  const token = useUserStore((store) => store.accessToken);

  const isMobile = useIsMobile();

  const { state } = useLocation();

  useEffect(() => {
    if (user && state?.justSignedUp) {
      addToast({
        title: t('profile.welcome', {
          context: user.gender === 'M' ? 'male' : 'female',
        }),
        description: t('profile.welcomeMessage'),
        color: 'success',
      });
    }
  }, [user, state?.justSignedUp, t]);

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

              <div className="flex justify-center">
                <AttendanceQr />
              </div>

              <Divider className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-8 lg:px-12">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiMail className="text-gray-500" />
                    <span className="font-semibold text-foreground-900">
                      {t('profile.email')}:
                    </span>
                  </div>
                  <p className="text-foreground-600">{user.email}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiPhone className="text-gray-500" />
                    <span className="font-semibold text-foreground-900">
                      {t('profile.phoneNumber')}:
                    </span>
                  </div>
                  <p className="text-foreground-600">
                    {phoneCountry && hasFlag(phoneCountry) && (
                      <span className="mr-[6px]">
                        {getUnicodeFlagIcon(phoneCountry)}
                      </span>
                    )}
                    {phoneFormatted}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiHome className="text-gray-500" />
                    <span className="font-semibold text-foreground-900">
                      {t('profile.address')}:
                    </span>
                  </div>
                  <p className="text-foreground-600">
                    {user.country && hasFlag(user.country) && (
                      <span className="mr-[6px]">
                        {getUnicodeFlagIcon(user.country)}
                      </span>
                    )}
                    {user.address}
                  </p>
                </div>
                {user.birthComune && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiMapPin className="text-gray-500" />
                      <span className="font-semibold text-foreground-900">
                        {t('profile.birthComune')}:
                      </span>
                    </div>
                    <p className="text-foreground-600">{user.birthComune}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiCalendar className="text-gray-500" />
                    <span className="font-semibold text-foreground-900">
                      {t('profile.birthDate')}:
                    </span>
                  </div>
                  <p className="text-foreground-600">
                    {format(user.birthDate, 'dd MMMM yyyy', {
                      locale: dateFnsLang(i18n),
                    }) || '-'}
                    {isToday(user.birthDate) && ' 🎂🥳'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiMapPin className="text-gray-500" />
                    <span className="font-semibold text-foreground-900">
                      {t('profile.birthCountry')}:
                    </span>
                  </div>
                  <p className="text-foreground-600">
                    {hasFlag(user.birthCountry) && (
                      <span className="mr-[6px]">
                        {getUnicodeFlagIcon(user.birthCountry)}
                      </span>
                    )}
                    {t(`countries.${user.birthCountry}`)}
                  </p>
                </div>
                {user.codiceFiscale && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiCode className="text-gray-500" />
                      <span className="font-semibold text-foreground-900">
                        {t('profile.codiceFiscale')}:
                      </span>
                    </div>
                    <Code size="md">{user.codiceFiscale}</Code>
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FiCreditCard className="text-gray-500" />
                    <span className="font-semibold text-foreground-900">
                      {t('profile.membershipCardNumber')}:
                    </span>
                  </div>
                  <p className="text-foreground-600">
                    {user.membershipCardNumber
                      ? t('profile.card', { n: user.membershipCardNumber })
                      : t('profile.notAMember')}
                  </p>
                </div>
              </div>

              <Divider className="my-4" />

              <div className="flex justify-center">
                <Button color="danger" onPress={logout}>
                  <AiOutlineLogout className="mr-2 inline-block" />
                  {t('auth.logout')}
                </Button>
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
