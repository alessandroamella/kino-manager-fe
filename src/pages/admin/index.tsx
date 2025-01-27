import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Spinner,
  Skeleton,
  Divider,
  Alert,
} from '@heroui/react';
import { getErrorMsg } from '../../types/error';
import { Member } from '../../types/Member';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiDownload, FiEdit } from 'react-icons/fi';
import useUserStore from '../../store/user';
import { FaTimes } from 'react-icons/fa';
import { MembershipCard } from '../../types/MembershipCard';
import { format } from 'date-fns';

interface MembershipCardExtended extends Omit<MembershipCard, 'member'> {
  member: Member | null;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const token = useUserStore((store) => store.accessToken);
  const [cards, setCards] = useState<MembershipCardExtended[] | null>(null);

  const setError = useCallback((err: string | null) => {
    _setError(err);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const hasFetchedUsers = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (hasFetchedUsers.current) {
        return;
      } else if (!token) {
        console.error('No access token found, not fetching users');
        return;
      }
      hasFetchedUsers.current = true;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<Member[]>('/v1/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError(getErrorMsg(err));
        setLoading(false);
        hasFetchedUsers.current = false;
      }
    };

    fetchUsers();
  }, [setError, token]);

  const hasFetchedCards = useRef(false);

  useEffect(() => {
    const fetchCards = async () => {
      if (hasFetchedCards.current) {
        return;
      } else if (!token) {
        console.error('No access token found, not fetching cards');
        return;
      } else if (!users) {
        console.error('Users not fetched yet, not fetching cards');
        return;
      }
      hasFetchedCards.current = true;
      try {
        const response = await axios.get<MembershipCard[]>('/v1/admin/cards', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCards(
          response.data.map((e) => ({
            ...e,
            member:
              (e.member?.id && users.find((u) => u.id === e.member.id)) || null,
          })),
        );
      } catch (err) {
        console.error('Error fetching cards:', getErrorMsg(err));
        setError(getErrorMsg(err));
        hasFetchedCards.current = false;
      }
    };

    fetchCards();
  }, [setError, token, users]);

  const availableCards = useMemo(() => {
    return cards?.filter((card) => !card.member);
  }, [cards]);

  const handleAssignCard = async (userId: number, cardNumber: number) => {
    if (!token) {
      console.error('No access token found, cannot assign card');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.patch<void>(
        '/v1/admin/add-card',
        { userId, membershipCardNumber: cardNumber },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log('Card assigned:', data);

      // update user and cards state
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              membershipCardNumber: cardNumber,
              memberSince: new Date(),
            };
          }
          return user;
        }),
      );
      setCards(
        cards?.map((card) => {
          if (card.number === cardNumber) {
            return {
              ...card,
              member: users.find((u) => u.id === userId) || null,
            }; // optimistic, member might not be fully updated yet
          }
          return card;
        }) || null,
      );
    } catch (err) {
      setError(getErrorMsg(err));
      console.error('Error assigning card:', getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!token) {
      window.alert('Please login to export data');
      return;
    }
    setIsExporting(true);
    try {
      const { data } = await axios({
        url: 'v1/admin/export-members',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: 'GET',
        responseType: 'blob', // important
      });
      // create file link in browser's memory
      const href = URL.createObjectURL(data);

      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      const date = new Date();
      const formattedDate = `${date.getDate()}-${
        date.getMonth() + 1
      }-${date.getFullYear()}`;
      link.setAttribute('download', `membri-${formattedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error(err);
      window.alert('Error exporting data: ' + getErrorMsg(err));
    } finally {
      setIsExporting(false);
    }
  };

  return loading ? (
    <Skeleton>
      <div className="w-full h-96" />
    </Skeleton>
  ) : (
    <main className="p-4 md:p-8 mb-4">
      {error && (
        <Alert className="-mt-2 mb-4" color="danger" title={t('errors.error')}>
          {error}
        </Alert>
      )}
      <div className="flex items-center mb-4 flex-row justify-between">
        <h1 className="text-2xl font-bold">{t('admin.adminPanel')}</h1>
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
      <div className="w-fit overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
        <Table aria-label="Users table" className="table pr-2">
          <TableHeader>
            <TableColumn>{t('admin.actions')}</TableColumn>
            <TableColumn>{t('profile.membershipCardNumberShort')}</TableColumn>
            <TableColumn>{t('profile.firstName')}</TableColumn>
            <TableColumn>{t('profile.lastName')}</TableColumn>
            <TableColumn>{t('profile.birthDate')}</TableColumn>
            <TableColumn>{t('profile.birthCountry')}</TableColumn>
            <TableColumn>{t('profile.email')}</TableColumn>
            <TableColumn>{t('profile.phoneNumber')}</TableColumn>
            <TableColumn>{t('admin.isAdmin')}</TableColumn>
            <TableColumn>{t('profile.memberSince')}</TableColumn>
          </TableHeader>
          <TableBody items={users}>
            {(user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Edit (removed)">
                      <Button
                        isIconOnly
                        variant="light"
                        aria-label="Edit"
                        isDisabled
                      >
                        <FiEdit size={18} />
                      </Button>
                    </Tooltip>
                  </div>
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
                        onSelectionChange={(selected) => {
                          if (selected.currentKey) {
                            const confirm = window.confirm(
                              t('admin.verifyUserWarning', {
                                number: selected.currentKey,
                                user: user.firstName + ' ' + user.lastName,
                              }),
                            );
                            if (!confirm) return;
                            handleAssignCard(
                              user.id,
                              parseInt(selected.currentKey),
                            );
                          }
                        }}
                      >
                        {availableCards.map((card) => (
                          <DropdownItem key={card.number}>
                            {t('profile.card', { n: card.number })}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  ) : availableCards === null ? (
                    <Spinner size="sm" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>
                  {user.birthDate ? format(user.birthDate, 'dd/MM/yyyy') : '-'}
                </TableCell>
                {/* Display birthDate */}
                <TableCell>{t(`countries.${user.birthCountry}`)}</TableCell>
                {/* Display birthCountry */}
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <FiCheck className="text-green-300" />
                  ) : (
                    <FaTimes className="text-red-300" />
                  )}
                </TableCell>
                <TableCell>
                  {user.memberSince ? (
                    format(user.memberSince, 'dd/MM/yyyy')
                  ) : (
                    <FaTimes className="text-red-300" />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Divider className="my-12" />

      <h2 className="text-2xl font-semibold mb-4">{t('admin.cards')}</h2>
      {cards ? (
        <div className="w-fit overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
          <Table aria-label="Cards table" className="table">
            <TableHeader>
              <TableColumn>
                {t('profile.membershipCardNumberShort')}
              </TableColumn>
              <TableColumn>{t('admin.assignedTo')}</TableColumn>
              <TableColumn>{t('profile.firstName')}</TableColumn>
              <TableColumn>{t('profile.lastName')}</TableColumn>
              <TableColumn>{t('profile.email')}</TableColumn>
            </TableHeader>
            <TableBody items={cards}>
              {(card) => (
                <TableRow key={card.number}>
                  <TableCell>{card.number}</TableCell>
                  <TableCell>{card.member?.id || '-'}</TableCell>
                  <TableCell>{card.member?.firstName || '-'}</TableCell>
                  <TableCell>{card.member?.lastName || '-'}</TableCell>
                  <TableCell>{card.member?.email || '-'}</TableCell>
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
    </main>
  );
};

export default AdminPanel;
