import { useState, useCallback } from 'react';
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
} from '@heroui/react';
import { Member } from '@/types/Member';

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

  const fetchUserData = useCallback(
    async (userId: string) => {
      try {
        const { data } = await axios.get(`/v1/admin/user/${userId}`);
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setScanError(getErrorMsg(error));
        setUserData(null);
        onClose();
      }
    },
    [onClose],
  );

  const sendDataToBackend = useCallback(
    async (userId: string) => {
      setIsLoggingAttendance(true);
      setLogAttendanceError(null);
      try {
        const { data } = await axios.post('/v1/admin/log-attendance', {
          userId: userId,
        });
        console.log('Attendance logged successfully:', data);
        setIsLoggingAttendance(false);
        onClose();
      } catch (error) {
        console.error('Error logging attendance:', error);
        setLogAttendanceError(getErrorMsg(error));
        setIsLoggingAttendance(false);
      }
    },
    [onClose],
  );

  const handleScan: OnResultFunction = useCallback(
    (result, error) => {
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
        fetchUserData(userId);
        onOpen();
      }
    },
    [fetchUserData, onOpen, onClose],
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

  const { t } = useTranslation();

  return (
    <div className="p-4">
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
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{t('attendance.modal.header')}</ModalHeader>
          <ModalBody>
            {userData ? (
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
                  ? t('attendance.modal.errorFetchingUser')
                  : t('attendance.modal.fetchingUser')}
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
