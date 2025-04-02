import LogAttendanceModal from '@/components/attendance/LogAttendanceModal';
import SignatureModal from '@/components/input/SignatureModal';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import { AttendedEvent } from '@/types/AttendedEvent';
import { getErrorMsg } from '@/types/error';
import downloadStreamedFile from '@/utils/download';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineLogout, AiOutlineSignature } from 'react-icons/ai';
import { BiTime } from 'react-icons/bi';
import { FaFileAlt } from 'react-icons/fa';
import {
  FiCalendar,
  FiChevronRight,
  FiCode,
  FiCreditCard,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
} from 'react-icons/fi';
import { useLocation, useSearchParams } from 'react-router';
import useUserStore from '../../store/user';
import { dateFnsLang } from '../../utils/dateFnsLang';
import useIsMobile from '../../utils/isMobile';
import AttendedEventCard from './AttendedEventCard';

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

  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[] | null>(
    null,
  );

  const fetchAttendedEvents = useCallback(async (token: string) => {
    try {
      const response = await axios.get('/v1/member/events-attended', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendedEvents(response.data);
    } catch (err) {
      console.error('Error fetching attended events:', getErrorMsg(err));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchAttendedEvents(token);
  }, [fetchAttendedEvents, token]);

  const downloadMembershipCardPdf = useCallback(async () => {
    if (!token || !user?.id) {
      console.error('No token provided to downloadMembershipCardPdf');
      addToast({
        title: t('errors.error'),
        description: t('errors.generic'),
        color: 'danger',
      });
      return;
    }
    try {
      addToast({
        title: t('profile.downloadingMembershipCard'),
        color: 'primary',
      });
      await downloadStreamedFile({
        url: `v1/membership-pdf/${user.id}`,
        filename: `membership-form-${user.id}.pdf`,
        token,
      });
    } catch (err) {
      console.error('Error downloading membership card:', getErrorMsg(err));
      addToast({
        title: t('errors.error'),
        description: t('errors.generic'),
        color: 'danger',
      });
    }
  }, [token, user?.id, t]);

  const [search, setSearch] = useSearchParams();

  const downloadPdfSearch = search.get('download-membership-pdf');
  const isDownloadingPdf = useRef(false);

  useEffect(() => {
    if (downloadPdfSearch === 'true' && !isDownloadingPdf.current) {
      isDownloadingPdf.current = true;
      downloadMembershipCardPdf().finally(() => {
        search.delete('download-membership-pdf');
        setSearch(search);
      });
    }
  }, [downloadMembershipCardPdf, downloadPdfSearch, search, setSearch]);

  return (
    <>
      <PageTitle title="profile" />
      <ScrollTop />

      <SignatureModal
        isOpen={isSignatureModalOpen}
        setIsOpen={setIsSignatureModalOpen}
        onSaveSignature={addSignature}
      />
      <LogAttendanceModal fetchAttendedEvents={fetchAttendedEvents} />

      <main className="mx-auto py-6 bg-background-50 -mt-2 md:mt-0 md:p-6 md:px-12 lg:px-16 xl:px-24">
        <Card shadow={isMobile ? 'none' : undefined}>
          <CardHeader className="flex justify-between items-center px-4 md:px-6 py-3 border-b-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('profile.myProfile')}
            </h2>

            <Button color="danger" variant="ghost" onPress={logout}>
              <AiOutlineLogout className="mr-2 inline-block" />
              {t('auth.logout')}
            </Button>
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
                  name={`${user.firstName} ${user.lastName}`}
                  src={
                    user.emailHash &&
                    `https://gravatar.com/avatar/${user.emailHash}`
                  }
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
              {attendedEvents && (
                <>
                  <div className="flex flex-col w-full">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FiCalendar className="text-primary" size={20} />
                      </div>
                      <h3 className="font-bold text-lg text-foreground-900">
                        {t('profile.attendedEvents')}
                      </h3>
                      {attendedEvents.length > 0 && (
                        <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-1 rounded-full">
                          {attendedEvents.length}
                        </span>
                      )}
                    </div>

                    {attendedEvents.length > 0 ? (
                      <div className="relative w-full mb-4">
                        <div
                          className="flex overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          }}
                        >
                          <div className="flex space-x-4 px-2">
                            {attendedEvents.map((event) => (
                              <div
                                className="snap-start flex-shrink-0"
                                key={new Date(event.checkInUTC).toUTCString()}
                              >
                                <AttendedEventCard attendedEvent={event} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {attendedEvents.length > 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center bg-background/80 backdrop-blur-sm p-1 rounded-l-lg shadow-md">
                            <div className="text-xs text-foreground-700 px-2 flex items-center gap-2">
                              <span>Scroll</span>
                              <FiChevronRight />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-foreground-100/50 rounded-lg p-6 flex flex-col items-center justify-center text-center mb-4">
                        <div className="bg-foreground-200/50 p-4 rounded-full mb-4">
                          <FiCalendar
                            size={24}
                            className="text-foreground-500"
                          />
                        </div>
                        <p className="text-foreground-700 mb-2">
                          {t('profile.noAttendedEvents')}
                        </p>
                        <p className="text-sm text-foreground-500">
                          {t('profile.attendEventMessage')}
                        </p>
                      </div>
                    )}
                  </div>
                  <Divider className="my-4" />
                </>
              )}

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
                    {user.membershipCardNumber && (
                      <Tooltip content={t('profile.downloadMembershipForm')}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={downloadMembershipCardPdf}
                          className="ml-2"
                        >
                          <FaFileAlt />
                        </Button>
                      </Tooltip>
                    )}
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
