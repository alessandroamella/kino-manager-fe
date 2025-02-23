import { useState, useCallback, useEffect } from 'react';
import { OnResultFunction, QrReader } from 'react-qr-reader';
import axios from 'axios';
import { getErrorMsg } from '@/types/error';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Alert,
  Spinner,
} from '@heroui/react';
import { Member } from '@/types/Member';
import PageTitle from '../PageTitle';
import useUserStore from '@/store/user';

const ScanAttendanceQr = () => {
  const [scanError, setScanError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userData, setUserData] = useState<Member | null>(null);
  const [userIdFromQr, setUserIdFromQr] = useState<string | null>(null);
  const [isLoggingAttendance, setIsLoggingAttendance] =
    useState<boolean>(false);
  const [logAttendanceError, setLogAttendanceError] = useState<string | null>(
    null,
  );
  const [users, setUsers] = useState<Member[] | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [fetchUsersError, setFetchUsersError] = useState<string | null>(null);

  const accessToken = useUserStore((store) => store.accessToken);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) {
        return;
      }

      setIsLoadingUsers(true);
      setFetchUsersError(null);
      try {
        const { data } = await axios.get('/v1/admin/users', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('Fetched users:', data);
        setUsers(data);
        setIsLoadingUsers(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchUsersError(getErrorMsg(error));
        setUsers(null);
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [accessToken]);

  const sendDataToBackend = useCallback(
    async (userId: string) => {
      if (!accessToken) {
        console.error('No access token found');
        return;
      }
      setIsLoggingAttendance(true);
      setLogAttendanceError(null);
      try {
        const { data } = await axios.post(
          '/v1/admin/log-attendance',
          {
            userId: userId,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        console.log('Attendance logged successfully:', data);
        setIsLoggingAttendance(false);
        onClose();
      } catch (error) {
        console.error('Error logging attendance:', error);
        setLogAttendanceError(getErrorMsg(error));
        setIsLoggingAttendance(false);
      }
    },
    [accessToken, onClose],
  );

  const handleScan: OnResultFunction = useCallback(
    (result, error) => {
      if (isOpen) {
        console.debug('Modal is already open, ignoring scan result', {
          result,
          error,
        });
        return;
      }
      if (error) {
        if (error.name === 'e2') {
          console.debug('QR code not found, error e2:', error);
          return;
        }
        console.error('QR Scanner Error:', error.name, error.message);
        setScanError(error.message || error.name);
        setUserData(null);
        onClose();
        return;
      }

      if (result) {
        console.log('QR Code Scanned:', result);
        const text = result.getText();
        setScanError(null);

        const userId = text;
        setUserIdFromQr(userId);

        if (users) {
          const foundUser = users.find((user) => user.id.toString() === userId);
          if (foundUser) {
            setUserData(foundUser);
            onOpen();
          } else {
            setUserData(null);
            setScanError(t('attendance.scanErrorUserNotFound')); // Assuming you add this translation key
            onClose(); // Or decide to keep modal open and show error in modal?
            console.error('User not found in fetched users:', userId);
          }
        } else {
          setUserData(null);
          setScanError(t('attendance.scanErrorNoUsersFetched')); // Assuming you add this translation key
          onClose();
          console.error('Users data not fetched yet or fetch failed.');
        }
      }
    },
    [isOpen, onClose, users, onOpen, t],
  );

  const handleResetScan = useCallback(() => {
    setScanError(null);
    setUserData(null);
    setUserIdFromQr(null);
    setLogAttendanceError(null);
  }, []);

  const handleConfirmAttendance = useCallback(() => {
    if (userIdFromQr) {
      sendDataToBackend(userIdFromQr);
    }
  }, [sendDataToBackend, userIdFromQr]);

  return (
    <div className="p-4">
      <PageTitle title={t('attendance.title')} />
      <h2 className="text-2xl font-bold">{t('attendance.title')}</h2>
      <div className="relative max-w-full h-fit">
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          videoContainerStyle={{ width: '100%' }}
          videoStyle={{ width: '100%' }}
          containerStyle={{ width: '100%' }}
        />
        {scanError && (
          <Alert color="danger">Error scanning QR code: {scanError}</Alert>
        )}
        {logAttendanceError && (
          <Alert color="danger">
            Error logging attendance: {logAttendanceError}
          </Alert>
        )}
        {fetchUsersError && (
          <Alert color="danger">Error fetching users: {fetchUsersError}</Alert>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{t('attendance.modal.header')}</ModalHeader>
          <ModalBody>
            {isLoadingUsers ? (
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : userData ? (
              <div>
                <p>
                  <strong>{t('attendance.modal.name')}:</strong>{' '}
                  {userData.firstName} {userData.lastName}
                </p>
                <p>
                  <strong>{t('attendance.modal.email')}:</strong>{' '}
                  {userData.email}
                </p>
                {/* Display other user data as needed */}
                <p>{t('attendance.modal.confirmPrompt')}</p>
              </div>
            ) : (
              <p>
                {scanError
                  ? scanError // Display scan error directly if user lookup failed within handleScan
                  : t('attendance.modal.fetchingUser')}{' '}
                {/* This text might not be relevant now as fetching happens upfront */}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={handleConfirmAttendance}
              isLoading={isLoggingAttendance}
              isDisabled={!userData}
            >
              {t('attendance.modal.confirmButton')}
            </Button>
            <Button color="secondary" onPress={onClose}>
              {t('attendance.modal.cancelButton')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="mt-5 flex justify-center">
        <Button onPress={handleResetScan}>{t('attendance.scanAgain')}</Button>
      </div>
    </div>
  );
};

export default ScanAttendanceQr;
