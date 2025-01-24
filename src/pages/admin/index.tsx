import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Form,
  Alert,
  Divider,
  DateInput,
  Spinner,
  Autocomplete,
  AutocompleteItem,
  Skeleton,
  Accordion,
  AccordionItem,
} from '@heroui/react';
import { getErrorMsg } from '../../types/error';
import { Member } from '../../types/Member';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiDownload, FiEdit } from 'react-icons/fi';
import useUserStore from '../../store/user';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { adminEditUserYupSchema } from '../../validators/adminEditUser';
import { FaTimes } from 'react-icons/fa';
import { CalendarDate } from '@internationalized/date';
import { MembershipCard } from '../../types/MembershipCard';
import countries from 'i18n-iso-countries';
import { dateToCalendarDate } from '../../utils/calendar';
import { normalize } from '../../utils/normalize';
import { tryStoi } from '../../utils/tryStoi';
import { format } from 'date-fns';

interface MembershipCardExtended extends Omit<MembershipCard, 'member'> {
  member: Member | null;
}

// this isn't actually enforced by the backend, but it's a good idea
enum DocumentType {
  CIE = 'CIE',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  OTHER = 'OTHER',
}

const AdminPanel = () => {
  const [users, setUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const { t } = useTranslation();

  const editModalOpen = useMemo(() => !!selectedUser, [selectedUser]);
  const closeEditModal = () => setSelectedUser(null);

  const token = useUserStore((store) => store.accessToken);

  // React Hook Form for Edit User Modal
  const {
    handleSubmit,
    register,
    getValues,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<Member>({
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      documentNumber: '',
      documentType: DocumentType.CIE,
      documentExpiry: null,
      membershipCardNumber: null,
      birthCountry: '',
      codiceFiscale: '',
      birthComune: null,
      birthDate: new Date(),
      verificationDate: null,
      verificationMethod: null,
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(adminEditUserYupSchema(t)) as any, // Use yup resolver with schema
  });

  const membershipCardNumber = watch('membershipCardNumber');
  const documentType = watch('documentType');
  const birthCountry = watch('birthCountry');
  const birthDate = watch('birthDate');
  const documentExpiry = watch('documentExpiry');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        console.error('No access token found, not fetching users');
        return;
      }
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
      }
    };

    fetchUsers();
  }, [token]);

  useEffect(() => {
    const fetchCards = async () => {
      if (!token) {
        console.error('No access token found, not fetching cards');
        return;
      } else if (!users) {
        console.error('Users not fetched yet, not fetching cards');
        return;
      }
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
      }
    };

    fetchCards();
  }, [token, users]);

  const handleEditUser = (user: Member) => {
    console.log('Editing user:', user);

    setValue('firstName', user.firstName);
    setValue('lastName', user.lastName);
    setValue('email', user.email);
    setValue('phoneNumber', user.phoneNumber);
    setValue('address', user.address);
    setValue('documentNumber', user.documentNumber || '');
    setValue(
      'documentType',
      (user.documentType as DocumentType) || DocumentType.CIE,
    ); // Default if null
    setValue(
      'documentExpiry',
      user.documentExpiry ? new Date(user.documentExpiry) : null,
    ); // Convert to Date if exists
    setValue('membershipCardNumber', user.membershipCardNumber);
    setValue('birthCountry', user.birthCountry);
    setValue('codiceFiscale', user.codiceFiscale || '');
    setValue('birthComune', user.birthComune || '');
    setValue('birthDate', new Date(user.birthDate)); // Convert to Date if exists

    setSelectedUser(user);
  };

  const [alert, setAlert] = useState<{
    error: boolean;
    content: string;
  } | null>(null);

  const saveEditedUser = async (data: Partial<Member>) => {
    data = {
      id: selectedUser?.id,
      ...normalize(data),
      membershipCardNumber: tryStoi(data.membershipCardNumber),
    };

    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('No access token found. Please log in.');
        setAlert({
          error: true,
          content: 'Please log in to edit users',
        });
        setLoading(false);
        return;
      }

      console.log('Editing user with data:', data);

      const response = await axios.patch(`/v1/admin/edit-user`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.membershipCardNumber && !selectedUser.membershipCardNumber) {
        // If we assigned a card, set its member to the user
        const card = cards?.find(
          (card) => card.number === data.membershipCardNumber,
        );
        if (card) {
          card.member = selectedUser;
          setCards([...cards!]);
        }
      }

      // Optimistically update the user in the table
      setUsers(
        users.map((user) =>
          user.id === response.data.id ? response.data : user,
        ),
      );

      closeEditModal();
      setAlert({
        error: false,
        content: 'User updated successfully',
      });
      setSelectedUser(null);
    } catch (err) {
      // setError(getErrorMsg(err));
      setAlert({
        error: true,
        content: 'Error updating user: ' + getErrorMsg(err),
      });
    } finally {
      setLoading(false);
      document.querySelector('.modal-body')?.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const [cards, setCards] = useState<MembershipCardExtended[] | null>(null);
  const availableCards = useMemo(() => {
    return cards?.filter((card) => !card.member);
  }, [cards]);

  const countryList = Object.keys(countries.getAlpha2Codes());

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

  const [printedValues, setPrintedValues] = useState<object | null>(null);
  function printValues() {
    setPrintedValues(getValues());
  }

  return loading ? (
    <div>{t('common.loading')}...</div>
  ) : error ? (
    <div>Error: {error}</div>
  ) : (
    <main className="p-4 md:p-8 mb-4">
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
            <TableColumn>{t('profile.firstName')}</TableColumn>
            <TableColumn>{t('profile.lastName')}</TableColumn>
            <TableColumn>{t('profile.birthDate')}</TableColumn>
            <TableColumn>{t('profile.birthCountry')}</TableColumn>
            <TableColumn>{t('profile.email')}</TableColumn>
            <TableColumn>{t('profile.membershipCardNumberShort')}</TableColumn>
            <TableColumn>{t('profile.phoneNumber')}</TableColumn>
            <TableColumn>{t('admin.isAdmin')}</TableColumn>
            <TableColumn>{t('profile.verified')}</TableColumn>
            <TableColumn>{t('admin.verificationMethod')}</TableColumn>
            <TableColumn>{t('profile.createdAt')}</TableColumn>
            <TableColumn>{t('profile.documentType')}</TableColumn>
            <TableColumn>{t('profile.documentNumber')}</TableColumn>
            <TableColumn>{t('profile.documentExpiry')}</TableColumn>
          </TableHeader>
          <TableBody items={users}>
            {(user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Edit">
                      <Button
                        isIconOnly
                        variant="light"
                        aria-label="Edit"
                        onPress={() => handleEditUser(user)}
                      >
                        <FiEdit size={18} />
                      </Button>
                    </Tooltip>
                  </div>
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
                <TableCell>{user.membershipCardNumber || '-'}</TableCell>
                <TableCell>{user.phoneNumber}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <FiCheck className="text-green-300" />
                  ) : (
                    <FaTimes className="text-red-300" />
                  )}
                </TableCell>
                <TableCell>
                  {user.verificationDate ? (
                    <FiCheck className="text-green-300" />
                  ) : (
                    <FaTimes className="text-red-300" />
                  )}
                </TableCell>
                <TableCell>{user.verificationMethod || '-'}</TableCell>
                <TableCell>{format(user.createdAt, 'dd/MM/yyyy')}</TableCell>
                <TableCell>{t(`document.${user.documentType}`)}</TableCell>
                <TableCell>{user.documentNumber || '-'}</TableCell>
                <TableCell>
                  {user.documentExpiry
                    ? format(user.documentExpiry, 'dd/MM/yyyy')
                    : '-'}
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

      {/* Edit User Modal */}
      <Modal
        size="3xl"
        isOpen={editModalOpen}
        onOpenChange={(e) => !e && closeEditModal()}
      >
        <ModalContent as={Form} onSubmit={handleSubmit(saveEditedUser)}>
          <ModalHeader>
            {t('admin.editUser', {
              user: selectedUser ? `#${selectedUser.id}` : '-',
            })}
          </ModalHeader>
          <ModalBody className="modal-body md:max-h-[70vh] w-full overflow-y-auto">
            {alert && (
              <Alert
                color={alert.error ? 'danger' : 'success'}
                onClose={() => setAlert(null)}
              >
                {alert.content}
              </Alert>
            )}

            {selectedUser ? (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    isRequired
                    type="text"
                    label={t('profile.firstName')}
                    isInvalid={!!errors.firstName}
                    errorMessage={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    isRequired
                    type="text"
                    label={t('profile.lastName')}
                    isInvalid={!!errors.lastName}
                    errorMessage={errors.lastName?.message}
                    {...register('lastName')}
                  />
                  <Input
                    isRequired
                    type="email"
                    label={t('profile.email')}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    isRequired
                    type="text"
                    label={t('profile.address')}
                    isInvalid={!!errors.address}
                    errorMessage={errors.address?.message}
                    {...register('address')}
                  />
                  <Input
                    isRequired
                    type="tel"
                    label={t('profile.phoneNumber')}
                    isInvalid={!!errors.phoneNumber}
                    errorMessage={errors.phoneNumber?.message}
                    {...register('phoneNumber')}
                  />

                  <Autocomplete
                    label="Paese di Nascita"
                    placeholder="Inizia a digitare il paese"
                    value={birthCountry}
                    defaultSelectedKey={selectedUser.birthCountry}
                    onSelectionChange={(e) =>
                      e && setValue('birthCountry', e.toString())
                    }
                    isRequired
                    labelPlacement="outside"
                    isInvalid={!!errors.birthCountry}
                    errorMessage={errors.birthCountry?.message}
                  >
                    {countryList.map((e) => (
                      <AutocompleteItem key={e}>
                        {t('countries.' + e)}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                  <Input
                    type="text"
                    label={t('profile.codiceFiscale')}
                    isInvalid={!!errors.codiceFiscale}
                    errorMessage={errors.codiceFiscale?.message}
                    {...register('codiceFiscale')}
                  />
                  <Input
                    type="text"
                    label={t('profile.birthComune')}
                    isInvalid={!!errors.birthComune}
                    errorMessage={errors.birthComune?.message}
                    {...register('birthComune')}
                  />
                  <DateInput
                    isRequired
                    label={t('profile.birthDate')}
                    defaultValue={dateToCalendarDate(
                      birthDate || selectedUser.birthDate,
                    )}
                    isInvalid={!!errors.birthDate}
                    errorMessage={errors.birthDate?.message}
                    {...{
                      ...register('birthDate'),
                      onChange: (date) => {
                        setValue(
                          'birthDate',
                          (date as unknown as CalendarDate).toDate('UTC'),
                        );
                      },
                    }}
                  />
                </div>

                <Divider className="my-4" />

                <h2 className="text-lg font-semibold">
                  {t('admin.verifyUser')}
                </h2>

                {!selectedUser.membershipCardNumber && membershipCardNumber && (
                  <Alert color="warning" title={t('common.warning')}>
                    {t('admin.verifyUserWarning', {
                      number: membershipCardNumber,
                      user:
                        selectedUser.firstName + ' ' + selectedUser.lastName,
                    })}
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('profile.documentType')}
                    </p>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="bordered" size="sm">
                          {t(`document.${documentType}`)}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Document Type"
                        selectionMode="single"
                        onSelectionChange={(selected) => {
                          if (selected) {
                            setValue(
                              'documentType',
                              selected.currentKey as DocumentType,
                            );
                          }
                        }}
                      >
                        {Object.values(DocumentType).map((type) => (
                          <DropdownItem key={type}>
                            {t(`document.${type}`)}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                  <Input
                    isRequired
                    type="text"
                    label={t('profile.documentNumber')}
                    isInvalid={!!errors.documentNumber}
                    errorMessage={errors.documentNumber?.message}
                    {...register('documentNumber')}
                  />
                  <DateInput
                    isRequired
                    label={t('profile.documentExpiry')}
                    defaultValue={
                      documentExpiry || selectedUser.documentExpiry
                        ? dateToCalendarDate(
                            (documentExpiry || selectedUser.documentExpiry)!,
                          )
                        : undefined
                    }
                    isInvalid={!!errors.documentExpiry}
                    errorMessage={errors.documentExpiry?.message}
                    {...{
                      ...register('documentExpiry'),
                      onChange: (date) => {
                        console.log('Date changed:', date);
                        setValue(
                          'documentExpiry',
                          (date as unknown as CalendarDate).toDate('UTC'),
                        );
                      },
                    }}
                  />
                  {selectedUser.membershipCardNumber ? (
                    <Tooltip content={t('admin.cardAlreadyAssigned')}>
                      <div className="w-full">
                        <Input
                          isRequired
                          isDisabled
                          type="text"
                          label={t('profile.membershipCardNumber')}
                          value={selectedUser.membershipCardNumber.toString()}
                        />
                      </div>
                    </Tooltip>
                  ) : availableCards ? (
                    <Dropdown>
                      <DropdownTrigger className="h-full">
                        <Button variant="bordered" size="sm">
                          {membershipCardNumber || t('admin.noCardAssigned')}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Membership Card Number"
                        selectionMode="single"
                        onSelectionChange={(selected) => {
                          if (selected.currentKey) {
                            console.log('Selected card:', selected.currentKey);
                            setValue(
                              'membershipCardNumber',
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
                  ) : (
                    <Spinner />
                  )}
                </div>

                <Accordion className="mt-4">
                  <AccordionItem title="DEBUG">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Button
                          type="button"
                          variant="bordered"
                          onPress={printValues}
                        >
                          Print Values
                        </Button>
                        <p className="mt-6">
                          Is valid:{' '}
                          <strong>{isValid ? 'true' : 'false'}</strong>
                        </p>
                        <p className="mt-2">
                          Errors:
                          <pre>
                            <code>{JSON.stringify(errors, null, 2)}</code>
                          </pre>
                        </p>
                      </div>

                      <pre>
                        <code>{JSON.stringify(printedValues, null, 2)}</code>
                      </pre>
                    </div>
                  </AccordionItem>
                </Accordion>
              </>
            ) : (
              <Skeleton>
                <div className="w-full h-96" />
              </Skeleton>
            )}
          </ModalBody>
          <ModalFooter className="flex gap-4 justify-center w-full">
            <Button
              color="secondary"
              variant="flat"
              type="button"
              onPress={() => closeEditModal()}
            >
              {t('common.cancel')}
            </Button>
            <Button
              isDisabled={!isValid || loading}
              color="primary"
              type="submit"
            >
              {loading ? <Spinner /> : t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
};

export default AdminPanel;
