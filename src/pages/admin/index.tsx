// frontend/components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
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
  DateInput,
} from '@heroui/react';
import { CalendarDate } from '@heroui/react';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getErrorMsg } from '../../types/error';
import { Member, VerificationMethod } from '../../types/Member';
import { dateToCalendarDate } from '../../utils/calendar';
import { useTranslation } from 'react-i18next';
import { FiEdit, FiFileText } from 'react-icons/fi';
import useUserStore from '../../store/user';

const AdminPanel = () => {
  const [users, setUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Member>>({});
  const [verifyFormData, setVerifyFormData] = useState<{
    documentData: string;
    verificationDate: CalendarDate | null;
  }>({ documentData: '', verificationDate: dateToCalendarDate(new Date()) });
  const { t } = useTranslation();

  const token = useUserStore((store) => store.accessToken);

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

  const handleEditUser = (user: Member) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      documentNumber: user.documentNumber,
      documentType: user.documentType,
      documentExpiry: user.documentExpiry,
      membershipNumber: user.membershipNumber,
      isAdmin: user.isAdmin,
    });
    setEditModalOpen(true);
  };

  const handleVerifyUser = (user: Member) => {
    setSelectedUser(user);
    setVerifyFormData({
      documentData: '',
      verificationDate: dateToCalendarDate(new Date()),
    });
    setVerifyModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };
  const handleEditCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.checked });
  };
  const handleVerifyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerifyFormData({ ...verifyFormData, documentData: e.target.value });
  };
  const handleVerificationDateChange = (date: CalendarDate | null) => {
    if (!date) return;
    setVerifyFormData({ ...verifyFormData, verificationDate: date });
  };

  const saveEditedUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('No access token found. Please log in.');
        setLoading(false);
        return;
      }

      const userDataToUpdate = { ...editFormData };

      await axios.patch(
        `/v1/admin/edit-user/${selectedUser.id}`,
        userDataToUpdate,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Optimistically update the user in the table
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? { ...user, ...userDataToUpdate } : user,
        ),
      );

      setEditModalOpen(false);
      toast.success(t('admin.userEditSuccess'));
    } catch (err) {
      setError(getErrorMsg(err));
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyUserDocument = async () => {
    if (!selectedUser || !verifyFormData.verificationDate) return;
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('No access token found. Please log in.');
        setLoading(false);
        return;
      }

      const verificationDateJS = verifyFormData.verificationDate.toDate('UTC');

      await axios.post(
        `/v1/admin/verify`,
        {
          memberId: selectedUser.id,
          documentData: verifyFormData.documentData,
          verificationDate: verificationDateJS.toISOString(),
          verificationMethod: VerificationMethod.MANUAL,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Optimistically update the user in the table - assuming verificationDate is returned in response
      setUsers(
        users.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              verificationDate: verificationDateJS,
              verificationMethod: VerificationMethod.MANUAL,
            };
          }
          return user;
        }),
      );

      setVerifyModalOpen(false);
      toast.success(t('admin.userVerifySuccess'));
    } catch (err) {
      setError(getErrorMsg(err));
      toast.error(getErrorMsg(err));
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
    <div>{t('common.loading')}...</div>
  ) : error ? (
    <div>Error: {error}</div>
  ) : (
    <div>
      <h1>{t('admin.adminPanel')}</h1>
      <Button
        color="primary"
        variant="shadow"
        onPress={handleExportExcel}
        isDisabled={isExporting}
      >
        {t('admin.exportToExcel')}
      </Button>{' '}
      <Table aria-label="Users table">
        <TableHeader>
          <TableColumn>{t('profile.firstName')}</TableColumn>
          <TableColumn>{t('profile.lastName')}</TableColumn>
          <TableColumn>{t('profile.email')}</TableColumn>
          <TableColumn>{t('profile.phone')}</TableColumn>
          <TableColumn>{t('admin.isAdmin')}</TableColumn>
          <TableColumn>{t('admin.verified')}</TableColumn>
          <TableColumn>{t('admin.actions')}</TableColumn>
        </TableHeader>
        <TableBody items={users}>
          {(user) => (
            <TableRow key={user.id}>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phoneNumber}</TableCell>
              <TableCell>
                {user.isAdmin ? t('common.yes') : t('common.no')}
              </TableCell>
              <TableCell>
                {user.verificationDate ? t('common.yes') : t('common.no')}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label="Edit"
                    onPress={() => handleEditUser(user)}
                  >
                    <FiEdit size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label="Verify Document"
                    onPress={() => handleVerifyUser(user)}
                  >
                    <FiFileText size={18} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Edit User Modal */}
      <Modal isOpen={editModalOpen} onOpenChange={setEditModalOpen}>
        <ModalContent>
          <ModalHeader>{t('admin.editUser')}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                type="text"
                label={t('profile.firstName')}
                name="firstName"
                value={editFormData.firstName || ''}
                onChange={handleEditFormChange}
              />
              <Input
                type="text"
                label={t('profile.lastName')}
                name="lastName"
                value={editFormData.lastName || ''}
                onChange={handleEditFormChange}
              />
              <Input
                type="email"
                label={t('profile.email')}
                name="email"
                value={editFormData.email || ''}
                onChange={handleEditFormChange}
                isDisabled // Email should probably be disabled for editing in admin panel?
              />
              <Input
                type="tel"
                label={t('profile.phone')}
                name="phoneNumber"
                value={editFormData.phoneNumber || ''}
                onChange={handleEditFormChange}
              />
              <Input
                type="text"
                label={t('profile.address')}
                name="address"
                value={editFormData.address || ''}
                onChange={handleEditFormChange}
              />
              <Input
                type="text"
                label={t('admin.documentNumber')}
                name="documentNumber"
                value={editFormData.documentNumber || ''}
                onChange={handleEditFormChange}
              />
              <Input
                type="text"
                label={t('admin.documentType')}
                name="documentType"
                value={editFormData.documentType || ''}
                onChange={handleEditFormChange}
              />
              <Input
                type="text"
                label={t('admin.membershipNumber')}
                name="membershipNumber"
                value={editFormData.membershipNumber || ''}
                onChange={handleEditFormChange}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={editFormData.isAdmin || false}
                  onChange={handleEditCheckboxChange}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 h-4 w-4"
                />
                <span>{t('admin.isAdmin')}</span>
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              variant="flat"
              onPress={() => setEditModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button color="primary" onPress={saveEditedUser}>
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Verify User Modal */}
      <Modal isOpen={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <ModalContent>
          <ModalHeader>{t('admin.verifyUserDocument')}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                type="text"
                label={t('admin.documentData')}
                placeholder={t('admin.enterDocumentData')}
                value={verifyFormData.documentData}
                onChange={handleVerifyFormChange}
              />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.verificationDate')}
                </p>
                <DateInput
                  value={verifyFormData.verificationDate}
                  onChange={handleVerificationDateChange}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.verificationMethod')}
                </p>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="bordered" size="sm">
                      {VerificationMethod.MANUAL}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Verification Method"
                    selectionMode="single"
                  >
                    <DropdownItem key={VerificationMethod.MANUAL}>
                      {VerificationMethod.MANUAL}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              variant="flat"
              onPress={() => setVerifyModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button color="primary" onPress={verifyUserDocument}>
              {t('admin.verifyUser')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default AdminPanel;
