import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { Member } from '@/types/Member';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from '@heroui/react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnResultFunction, QrReader } from 'react-qr-reader';
import PageTitle from '../navigation/PageTitle';

const ScanAttendanceQr = () => {
  const [scanError, setScanError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userData, setUserData] = useState<Member | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isLoggingAttendance, setIsLoggingAttendance] =
    useState<boolean>(false);
  const [logAttendanceError, setLogAttendanceError] = useState<string | null>(
    null,
  );
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [fetchUsersError, setFetchUsersError] = useState<string | null>(null);

  const usersRef = useRef<Member[] | null>(null);

  const accessToken = useUserStore((store) => store.accessToken);
  const { t } = useTranslation();

  // Fetch users effect remains the same
  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) return;

      setIsLoadingUsers(true);
      setFetchUsersError(null);
      try {
        const { data } = await axios.get('/v1/admin/users', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('Fetched users:', data);
        usersRef.current = data;
      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchUsersError(getErrorMsg(error));
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [accessToken]);

  const handleScan: OnResultFunction = useCallback(
    async (result, error, reader) => {
      if (isOpen) {
        console.debug('Modal is already open, ignoring scan result');
        return;
      }

      if (error) {
        if (['e2', 't'].includes(error.name)) {
          console.debug('QR code not found, error e2:', error);
          return;
        }
        console.error('QR Scanner Error:', error.name, error.message);
        setScanError(error.message || error.name);
        return;
      }

      if (!result) {
        console.error('No result found in QR code scan');
        return;
      }

      const text = result.getText();
      setScanError(null);

      setJwt(text);

      const jwtPayload = jwtDecode<{ u: number; iat: number; exp: number }>(
        text,
      );
      if (!jwtPayload) {
        setScanError('Invalid QR code');
        console.error('Invalid QR code:', text);
        return;
      }
      console.log('Decoded QR code:', jwtPayload);

      console.log(
        'Got QR code:',
        text + '\npayload:',
        jwtPayload,
        '\nReader:',
        reader,
      );

      // Instead of checking isLoadingUsers directly, we check the current state
      // of users to determine if we can proceed
      const users = usersRef.current;

      if (!users) {
        setScanError('Please wait while user data is loading...');
        return;
      }

      const foundUser = users.find((user) => user.id === jwtPayload.u);
      if (foundUser) {
        setUserData(foundUser);
        onOpen();
      } else {
        setScanError(t('errors.auth.userNotFound'));
        console.error(
          'User not found in fetched users:',
          jwtPayload.u,
          'users:',
          users,
        );
      }
    },
    [isOpen, onOpen, t], // Remove isLoadingUsers from dependencies
  );

  const handleResetScan = useCallback(() => {
    setScanError(null);
    setUserData(null);
    setJwt(null);
    setLogAttendanceError(null);
  }, []);

  const sendDataToBackend = useCallback(
    async (jwt: string) => {
      if (!accessToken) {
        console.error('No access token found');
        return;
      }
      setIsLoggingAttendance(true);
      setLogAttendanceError(null);
      try {
        const { data } = await axios.post(
          '/v1/admin/log-attendance',
          { jwt },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        console.log('Attendance logged successfully:', data);
        setIsLoggingAttendance(false);
        onClose();

        window.alert(t('attendance.checkedInSuccess'));
      } catch (error) {
        console.error('Error logging attendance:', error);
        setLogAttendanceError(getErrorMsg(error));
        setIsLoggingAttendance(false);
      }
    },
    [accessToken, onClose, t],
  );

  const handleConfirmAttendance = useCallback(() => {
    if (!jwt) return;
    sendDataToBackend(jwt);
  }, [sendDataToBackend, jwt]);

  return (
    <div className="p-4">
      <PageTitle title={t('attendance.title')} />
      <h2 className="text-2xl my-1 font-bold text-center">
        {t('attendance.title')}
      </h2>

      <div className="relative max-w-full">
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

        <div className="max-w-lg mx-auto">
          <QrReader
            onResult={handleScan}
            scanDelay={500}
            constraints={{ facingMode: 'environment' }}
          />
        </div>
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
                <p>{t('attendance.modal.confirmPrompt')}</p>
              </div>
            ) : (
              <p>
                {scanError ? scanError : t('attendance.modal.fetchingUser')}{' '}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose}>{t('common.cancel')}</Button>
            <Button
              color="primary"
              onPress={handleConfirmAttendance}
              isLoading={isLoggingAttendance}
              isDisabled={!userData}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="mt-5 flex justify-center">
        <Button onPress={handleResetScan}>{t('attendance.resetScan')}</Button>
      </div>
    </div>
  );
};

export default ScanAttendanceQr;
