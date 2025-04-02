import AttendanceTable from '@/components/attendance/AttendanceTable';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import { getUserStr } from '@/lib/utils';
import { OpeningDayWithAttendees } from '@/types/OpeningDay';
import downloadStreamedFile from '@/utils/download';
import { isMembershipPdfDataDto } from '@/utils/isMembershipPdfDataDto';
import {
  Accordion,
  AccordionItem,
  addToast,
  Alert,
  Button,
  Card,
  CardBody,
  Code,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import axios from 'axios';
import { hasFlag } from 'country-flag-icons';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { format, formatDate } from 'date-fns';
import { clamp } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCashRegister, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { FiCheck, FiDownload, FiPrinter } from 'react-icons/fi';
import { GiHamburger } from 'react-icons/gi';
import { Link } from 'react-router';
import StatsCharts from '../../components/admin/StatsCharts';
import ViewSignatureModal from '../../components/admin/ViewSignatureModal';
import Expenses from '../../components/expense/Expenses';
import useUserStore from '../../store/user';
import { getErrorMsg } from '../../types/error';
import { MemberExtended } from '../../types/Member';
import { MembershipCard } from '../../types/MembershipCard';

interface MembershipCardExtended extends Omit<MembershipCard, 'member'> {
  member: MemberExtended | null;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<MemberExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const token = useUserStore((store) => store.accessToken);
  const [cards, setCards] = useState<MembershipCardExtended[] | null>(null);

  const userWithCards = useMemo(() => {
    if (!users || !cards) return null;

    return users.map((user) => {
      const card = cards.find((c) => c.member?.id === user.id);
      return {
        ...user,
        membershipCardNumber: card ? card.number : null,
      };
    });
  }, [cards, users]);

  const setError = useCallback((err: string | null) => {
    _setError(err);
    ScrollTop.scrollTop();
  }, []);

  const hasFetchedUsers = useRef(false);
  const hasFetchedCards = useRef(false); // Add ref for cards fetch

  useEffect(() => {
    const fetchUsersAndCards = async () => {
      // Combine fetching users and cards
      if (hasFetchedUsers.current) {
        return;
      } else if (!token) {
        console.error('No access token found, not fetching users and cards');
        return;
      }
      hasFetchedUsers.current = true;
      setLoading(true);
      setError(null);
      try {
        const usersResponse = await axios.get<MemberExtended[]>(
          '/v1/admin/users',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        console.log('Users:', usersResponse.data);
        setUsers(usersResponse.data);

        const cardsResponse = await axios.get<MembershipCard[]>(
          '/v1/admin/cards',
          {
            // Fetch cards after users
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        console.log('Membership cards:', cardsResponse.data);

        setCards(
          cardsResponse.data.map((e) => ({
            ...e,
            member:
              (e.member?.id &&
                usersResponse.data.find((u) => u.id === e.member.id)) ||
              null, // Use usersResponse.data here
          })),
        );
        hasFetchedCards.current = true; // Mark cards as fetched
        setLoading(false);
      } catch (err) {
        setError(getErrorMsg(err));
        setLoading(false);
        hasFetchedUsers.current = false;
        hasFetchedCards.current = false; // Reset cards fetch flag as well on error
      }
    };

    fetchUsersAndCards(); // Call combined fetch function
  }, [setError, token]);

  const availableCards = useMemo(() => {
    return cards?.filter((card) => !card.member);
  }, [cards]);

  const handleAssignCard = async (
    user: MemberExtended,
    cardNumber: number | null,
  ) => {
    if (typeof cardNumber !== 'number') {
      console.log('No card number selected, cannot assign card');
      return;
    } else if (!token) {
      console.error('No access token found, cannot assign card');
      return;
    }
    const confirm = window.confirm(
      t('admin.verifyUserWarning', {
        number: cardNumber,
        user: user.firstName + ' ' + user.lastName,
      }),
    );
    if (!confirm) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.patch<void>(
        '/v1/admin/add-card',
        { userId: user.id, membershipCardNumber: cardNumber },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log('Card assigned:', data);

      // update user and cards state
      setUsers(
        (
          prevUsers, // Use functional update for users
        ) =>
          prevUsers.map((u) => {
            if (u.id === user.id) {
              return {
                ...u,
                membershipCardNumber: cardNumber,
                memberSince: new Date(),
              };
            }
            return u; // return u, not user
          }),
      );
      setCards(
        (
          prevCards, // Use functional update for cards
        ) =>
          prevCards?.map((card) => {
            if (card.number === cardNumber) {
              return {
                ...card,
                member: users.find((u) => u.id === user.id) || null, // use latest users state
              };
            }
            return card;
          }) || null,
      );

      addToast({
        title: t('admin.cardAssigned', {
          number: cardNumber,
          user: user.firstName + ' ' + user.lastName,
        }),
        color: 'success',
      });
    } catch (err) {
      setError(getErrorMsg(err));
      console.error('Error assigning card:', getErrorMsg(err));

      addToast({
        title: t('admin.errorAssigningCard', {
          number: cardNumber,
          user: user.firstName + ' ' + user.lastName,
        }),
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const downloadMembershipFormPDF = async (id: number) => {
    if (!token) {
      window.alert('Please login to download the form');
      return;
    }
    try {
      downloadStreamedFile({
        url: `v1/membership-pdf/${id}`,
        filename: `membership-form-${id}.pdf`,
        token,
      });
    } catch (err) {
      console.error('Error downloading membership form:', getErrorMsg(err));
      window.alert('Error downloading membership form: ' + getErrorMsg(err));
    }
  };

  const handleExportExcel = async () => {
    if (!token) {
      window.alert('Please login to export data');
      return;
    }
    setIsExporting(true);
    try {
      downloadStreamedFile({
        url: 'v1/admin/export-members',
        filename: `membri-${formatDate(
          new Date(),
          'dd-MM-yyyy_HH-mm-ss',
        )}.xlsx`,
        token,
      });
    } catch (err) {
      console.error(err);
      window.alert('Error exporting data: ' + getErrorMsg(err));
    } finally {
      setIsExporting(false);
    }
  };

  const [viewingSignature, setViewingSignature] = useState<string | null>(null);

  const [openingDays, setOpeningDays] = useState<
    OpeningDayWithAttendees[] | null
  >(null);

  useEffect(() => {
    const fetchOpeningDays = async () => {
      if (!token) {
        console.error('No access token found, not fetching opening days');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get<OpeningDayWithAttendees[]>(
          '/v1/opening-day/with-attendees',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        console.log('Opening days:', data);
        setOpeningDays(data);
      } catch (err) {
        setError(getErrorMsg(err));
        console.error('Error fetching opening days:', getErrorMsg(err));
      } finally {
        setLoading(false);
      }
    };

    fetchOpeningDays();
  }, [setError, token]);

  return loading ? (
    <Skeleton>
      <div className="w-full h-96" />
    </Skeleton>
  ) : (
    <>
      <ViewSignatureModal
        signatureKey={viewingSignature}
        setSignatureKey={setViewingSignature}
      />
      <PageTitle title="admin" />
      <main className="p-4 md:p-8 mb-4">
        {error && (
          <Alert
            className="-mt-2 mb-4"
            color="danger"
            title={t('errors.error')}
          >
            {error}
          </Alert>
        )}
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <h1 className="text-2xl font-bold">{t('admin.adminPanel')}</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              isDisabled={location.pathname.replace(/\//g, '') === 'cashier'}
              as={Link}
              color="secondary"
              to="/cashier"
            >
              <FaCashRegister className="mr-2" />
              {t('pages.cashier')}
            </Button>
            <Button
              isDisabled={location.pathname.replace(/\//g, '') === 'cashier'}
              as={Link}
              color="warning"
              to="/menu"
            >
              <GiHamburger className="mr-2" />
              {t('pages.menu')}
            </Button>
          </div>
        </div>
        <div className="w-full overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
          <div className="flex items-center mb-4 flex-row justify-between">
            <h3 className="font-medium text-lg">
              {t('admin.nUsers', { count: users.length })}
            </h3>
            <Button
              color="primary"
              variant="shadow"
              onPress={handleExportExcel}
              isDisabled={isExporting}
            >
              <FiDownload size={18} className="mr-1" />
              {t('admin.exportToExcel')}
            </Button>
          </div>
          {userWithCards ? (
            <Table
              isVirtualized
              rowHeight={50}
              isStriped
              maxTableHeight={clamp(users.length, 1, 5) * 100}
              aria-label="Users table"
              className="table pr-2"
            >
              <TableHeader>
                <TableColumn>{t('admin.actions')}</TableColumn>
                <TableColumn>
                  {t('profile.membershipCardNumberShort')}
                </TableColumn>
                <TableColumn>{t('profile.firstName')}</TableColumn>
                <TableColumn>{t('profile.lastName')}</TableColumn>
                <TableColumn className="min-w-32">
                  {t('profile.gender')}
                </TableColumn>
                <TableColumn>{t('profile.birthDate')}</TableColumn>
                <TableColumn className="min-w-36">
                  {t('admin.bornIn')}
                </TableColumn>
                <TableColumn>{t('profile.email')}</TableColumn>
                <TableColumn>{t('profile.phoneNumber')}</TableColumn>
                <TableColumn>{t('profile.codiceFiscale')}</TableColumn>
                <TableColumn className="min-w-[26rem]">
                  {t('profile.address')}
                </TableColumn>
                <TableColumn className="min-w-52">
                  {t('profile.streetName')}
                </TableColumn>
                <TableColumn>{t('profile.streetNumber')}</TableColumn>
                <TableColumn>{t('profile.postalCode')}</TableColumn>
                <TableColumn className="min-w-52">
                  {t('profile.city')}
                </TableColumn>
                <TableColumn>{t('profile.province')}</TableColumn>
                <TableColumn>{t('profile.country')}</TableColumn>
                <TableColumn>{t('profile.birthProvince')}</TableColumn>
                <TableColumn>{t('profile.birthComune')}</TableColumn>
                <TableColumn>{t('profile.birthCountry')}</TableColumn>
                <TableColumn>{t('profile.memberSince')}</TableColumn>
                <TableColumn>{t('admin.isAdmin')}</TableColumn>
                <TableColumn>{t('admin.ipAddress')}</TableColumn>
                <TableColumn>{t('signup.signature')}</TableColumn>
              </TableHeader>
              <TableBody items={userWithCards}>
                {(user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {isMembershipPdfDataDto(user) && (
                        <Tooltip content={t('profile.downloadMembershipForm')}>
                          <Button
                            variant="light"
                            aria-label="Edit"
                            onPress={() => downloadMembershipFormPDF(user.id)}
                            isIconOnly
                          >
                            <FiPrinter size={18} />
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.membershipCardNumber ? (
                        user.membershipCardNumber
                      ) : availableCards && availableCards.length > 0 ? (
                        <Dropdown>
                          <DropdownTrigger>
                            <Button variant="bordered" size="sm">
                              {t('admin.assignCard')}
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Membership Card Number"
                            selectionMode="single"
                            onSelectionChange={(selected) =>
                              handleAssignCard(
                                user,
                                selected.currentKey !== undefined
                                  ? parseInt(selected.currentKey)
                                  : null,
                              )
                            }
                          >
                            {availableCards.map((card) => (
                              <DropdownItem key={card.number}>
                                {t('profile.card', { n: card.number })}
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
                      ) : cards === null ? ( // Check cards directly instead of availableCards for loading state
                        <Spinner size="sm" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{t(`gender.${user.gender}`)}</TableCell>

                    <TableCell>
                      {user.birthDate
                        ? format(user.birthDate, 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>

                    <TableCell className="min-w-32">
                      <span className="flex items-center">
                        {hasFlag(user.birthCountry) &&
                          getUnicodeFlagIcon(user.birthCountry) + ' '}

                        {user.birthComune
                          ? `${user.birthComune}${
                              user.birthProvince
                                ? ` (${user.birthProvince})`
                                : ''
                            }`
                          : t(`countries.${user.birthCountry}`)}
                      </span>
                    </TableCell>

                    <TableCell>{user.email}</TableCell>
                    <TableCell className="min-w-36">
                      {user.phoneNumber.toString()}
                    </TableCell>
                    <TableCell>
                      <Code>{user.codiceFiscale || '-'}</Code>
                    </TableCell>

                    <TableCell>{user.address}</TableCell>
                    <TableCell>{user.streetName || '-'}</TableCell>

                    <TableCell>{user.streetNumber || '-'}</TableCell>

                    <TableCell>{user.postalCode || '-'}</TableCell>

                    <TableCell>{user.city || '-'}</TableCell>
                    <TableCell>{user.province || '-'}</TableCell>

                    <TableCell>{user.country || '-'}</TableCell>

                    <TableCell>{user.birthProvince || '-'}</TableCell>

                    <TableCell>{user.birthComune || '-'}</TableCell>

                    <TableCell>{t(`countries.${user.birthCountry}`)}</TableCell>

                    <TableCell>
                      {user.memberSince ? (
                        format(user.memberSince, 'dd/MM/yyyy')
                      ) : (
                        <FaTimes color="red" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <FiCheck color="green" />
                      ) : (
                        <FaTimes color="red" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.ipAddress ? (
                        <Tooltip
                          content={
                            user.deviceInfo ? (
                              <ul>
                                {Object.entries(user.deviceInfo).map(
                                  ([key, value]) => (
                                    <li key={key}>{`${key}: ${
                                      typeof value === 'boolean'
                                        ? value
                                          ? t('common.yes')
                                          : t('common.no')
                                        : value
                                    }`}</li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              '-'
                            )
                          }
                        >
                          <p>{user.ipAddress}</p>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {user.signatureR2Key ? (
                        <Button
                          variant="light"
                          isIconOnly
                          onPress={() =>
                            setViewingSignature(user.signatureR2Key)
                          }
                        >
                          <FaExternalLinkAlt />
                        </Button>
                      ) : (
                        <FaTimes className="mx-auto" color="red" />
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Skeleton>
              <div className="w-full h-96" />
            </Skeleton>
          )}
        </div>

        <Divider className="my-12" />

        {openingDays && users ? (
          <AttendanceTable
            error={error}
            isLoading={loading}
            users={users}
            openingDays={openingDays}
          />
        ) : (
          <Skeleton>
            <div className="w-full h-96" />
          </Skeleton>
        )}

        <Divider className="my-12" />

        {users.length > 0 && (
          <>
            <Card>
              <CardBody>
                <Accordion>
                  <AccordionItem
                    key="1"
                    aria-label="Accordion 1"
                    title={t('charts.charts')}
                  >
                    <StatsCharts users={users} />
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>
            <Divider className="my-12" />
          </>
        )}

        <h2 className="text-2xl font-semibold mb-4">{t('admin.cards')}</h2>
        {cards ? (
          <div className="w-full overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
            <Table
              isVirtualized
              rowHeight={30}
              maxTableHeight={clamp(cards.length, 1, 5) * 60}
              isStriped
              aria-label="Cards table"
              className="table"
            >
              <TableHeader>
                <TableColumn>
                  {t('profile.membershipCardNumberShort')}
                </TableColumn>
                <TableColumn>{t('admin.assignedTo')}</TableColumn>
              </TableHeader>
              <TableBody items={cards}>
                {(card) => (
                  <TableRow key={card.number}>
                    <TableCell>{card.number}</TableCell>
                    <TableCell>
                      {card.member ? getUserStr(card.member) : '-'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Skeleton>
            <div className="w-full h-96" />
          </Skeleton>
        )}

        <Divider className="my-12" />

        {users && <Expenses users={users} />}
      </main>
    </>
  );
};

export default AdminPanel;
