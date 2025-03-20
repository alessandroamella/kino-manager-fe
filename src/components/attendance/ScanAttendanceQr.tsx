import { cn } from '@/lib/utils';
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
import {
  BarcodeDetector,
  ZXING_WASM_VERSION,
  prepareZXingModule,
} from 'barcode-detector/ponyfill';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';
import PageTitle from '../navigation/PageTitle';

const ScanAttendanceQr = () => {
  // **New States for Modals and Messages**
  const [scanErrorModalOpen, setScanErrorModalOpen] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);
  const {
    isOpen: isSuccessModalOpen,
    onOpen: onSuccessModalOpen,
    onClose: onSuccessModalClose,
  } = useDisclosure();
  const [statusModalMessage, setStatusModalMessage] = useState<string | null>(
    null,
  );
  const [statusModalType, setStatusModalType] = useState<
    'success' | 'error' | 'warning' | null
  >(null); // 'success' | 'error' | 'warning'

  const [userData, setUserData] = useState<Member | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isLoggingAttendance, setIsLoggingAttendance] =
    useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [fetchUsersError, setFetchUsersError] = useState<string | null>(null);
  const [isBarcodeAPISupported, setIsBarcodeAPISupported] =
    useState<boolean>(false);
  const [isCameraStreamActive, setIsCameraStreamActive] =
    useState<boolean>(false);
  const [isScanActive, setIsScanActive] = useState<boolean>(false);

  const usersRef = useRef<Member[] | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);

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
        setStatusModalType('error');
        setStatusModalMessage(getErrorMsg(error));
        onSuccessModalOpen(); // Reusing the success modal for errors too
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [accessToken, onSuccessModalOpen]);

  const stopCameraStream = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
      setIsCameraStreamActive(false);
    }
  }, []);

  const startScan = useCallback(async () => {
    setIsScanActive(true);
    setIsBarcodeAPISupported(false);
    setIsCameraStreamActive(false);
    setScanErrorMessage(null);

    const videoElement = videoRef.current;

    try {
      const supportedFormats = await BarcodeDetector.getSupportedFormats();
      console.log('Supported Barcode Formats (polyfill):', supportedFormats);
      if (!supportedFormats.includes('qr_code')) {
        console.warn(
          'QR code format not supported by BarcodeDetector polyfill.',
        );
        setScanErrorMessage(t('errors.scanner.qrCodeNotSupported'));
        setScanErrorModalOpen(true);
        setIsBarcodeAPISupported(false);
        setIsScanActive(false); // Stop scan if QR code not supported
        return;
      }

      setIsBarcodeAPISupported(true);

      prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) => {
            if (path.endsWith('.wasm')) {
              const url = `https://unpkg.com/zxing-wasm@${ZXING_WASM_VERSION}/dist/reader/${path}`;
              console.log('Loading ZXing WASM:', url, {
                path,
                prefix,
                ZXING_WASM_VERSION,
              });
              return url;
            }
            return prefix + path;
          },
        },
      });

      barcodeDetectorRef.current = new BarcodeDetector({
        formats: ['qr_code'],
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        console.log('Camera stream:', stream);
        if (videoElement) {
          videoElement.srcObject = stream;
          setIsCameraStreamActive(true);
        } else {
          console.error('Video element ref is not available');
          setScanErrorMessage(t('errors.scanner.videoElementError'));
          setScanErrorModalOpen(true);
          setIsCameraStreamActive(false);
          setIsScanActive(false); // Stop scan if video element error
        }
      } catch (cameraError) {
        console.error('Error accessing camera:', cameraError);
        setScanErrorMessage(t('errors.scanner.cameraAccessError'));
        setScanErrorModalOpen(true);
        setIsCameraStreamActive(false);
        setIsScanActive(false); // Stop scan if camera access error
      }
    } catch (error) {
      console.error(
        'Error getting supported formats from BarcodeDetector polyfill:',
        error,
      );
      setScanErrorMessage(t('errors.scanner.barcodeApiError'));
      setScanErrorModalOpen(true);
      setIsBarcodeAPISupported(false);
      setIsScanActive(false); // Stop scan if barcode API error
    }
  }, [t]);

  const stopScan = useCallback(() => {
    setIsScanActive(false);
    stopCameraStream();
  }, [stopCameraStream]);

  useEffect(() => {
    prepareZXingModule(); // Initialize ZXing module on component mount
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const handleBarcodeScan = useCallback(
    async (rawValue: string) => {
      if (isSuccessModalOpen || scanErrorModalOpen) {
        // Check both modals
        console.debug('Modal is already open, ignoring scan result');
        return;
      }

      setScanErrorMessage(null);
      setJwt(rawValue);

      navigator.vibrate?.(400); // vibrate on successful scan

      try {
        const jwtPayload = jwtDecode<{ u: number; iat: number; exp: number }>(
          rawValue,
        );
        if (!jwtPayload) {
          setScanErrorMessage('Invalid QR code');
          setScanErrorModalOpen(true);
          console.error('Invalid QR code:', rawValue);
          return;
        }
        console.log('Decoded QR code payload:', jwtPayload);

        const users = usersRef.current;

        if (!users) {
          setScanErrorMessage('Please wait while user data is loading...');
          setScanErrorModalOpen(true);
          return;
        }

        const foundUser = users.find((user) => user.id === jwtPayload.u);
        if (foundUser) {
          setUserData(foundUser);
          onSuccessModalOpen(); // Open success modal now for confirmation
        } else {
          setScanErrorMessage(t('errors.scanner.auth.userNotFound'));
          setScanErrorModalOpen(true);
          console.error(
            'User not found in fetched users:',
            jwtPayload.u,
            'users:',
            users,
          );
        }
      } catch (error) {
        setScanErrorMessage('Invalid QR code format or content');
        setScanErrorModalOpen(true);
        console.error('Error decoding or processing QR code:', error);
      }
    },
    [isSuccessModalOpen, onSuccessModalOpen, t, scanErrorModalOpen],
  );

  useEffect(() => {
    if (!isScanActive || !isBarcodeAPISupported || !isCameraStreamActive)
      return;

    const detectBarcode = async () => {
      if (
        !videoRef.current ||
        videoRef.current.readyState < 2 ||
        !barcodeDetectorRef.current ||
        isSuccessModalOpen ||
        scanErrorModalOpen // Check both modals
      ) {
        animationFrameRef.current = requestAnimationFrame(detectBarcode);
        return;
      }

      try {
        const barcodes = await barcodeDetectorRef.current.detect(
          videoRef.current,
        );
        if (barcodes.length > 0) {
          const qrBarcode = barcodes.find(
            (barcode) => barcode.format === 'qr_code',
          );
          if (qrBarcode) {
            const rawValue = qrBarcode.rawValue;
            if (rawValue) {
              handleBarcodeScan(rawValue);
              return;
            } else {
              console.warn('QR code raw value is empty.');
            }
          } else {
            console.debug(
              'No QR code detected, but other barcodes found:',
              barcodes.map((bc) => bc.format),
            );
          }
        } else {
          console.debug('No barcode detected in this frame.');
        }
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          console.error('Barcode detection error:', error);
          setScanErrorMessage(t('errors.scanner.barcodeDetectionError'));
          setScanErrorModalOpen(true);
        }
      } finally {
        if (!isSuccessModalOpen && !scanErrorModalOpen) {
          // Check both modals
          animationFrameRef.current = requestAnimationFrame(detectBarcode);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(detectBarcode);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    handleBarcodeScan,
    isBarcodeAPISupported,
    isSuccessModalOpen,
    t,
    scanErrorModalOpen,
    isScanActive,
    isCameraStreamActive,
  ]);

  const handleStopScanButton = useCallback(() => {
    setScanErrorMessage(null);
    setScanErrorModalOpen(false);
    setUserData(null);
    setJwt(null);
    stopScan();
    setStatusModalMessage(null);
    setStatusModalType(null);
  }, [stopScan]);

  const sendDataToBackend = useCallback(
    async (jwt: string) => {
      if (!accessToken) {
        console.error('No access token found');
        return;
      }
      setIsLoggingAttendance(true);
      setStatusModalMessage(null);
      setStatusModalType(null);
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
        setStatusModalType('success');
        setStatusModalMessage(t('attendance.checkedInSuccess'));
        onSuccessModalOpen(); // Open success modal with success message
      } catch (error) {
        console.error('Error logging attendance:', error);
        setIsLoggingAttendance(false);
        setStatusModalType('error');
        setStatusModalMessage(getErrorMsg(error));
        onSuccessModalOpen(); // Open success modal with error message
      }
    },
    [accessToken, onSuccessModalOpen, t],
  );

  const handleConfirmAttendance = useCallback(() => {
    if (!jwt) return;
    sendDataToBackend(jwt);
  }, [sendDataToBackend, jwt]);

  const handleScanErrorModalClose = () => {
    setScanErrorModalOpen(false);
    setScanErrorMessage(null);
  };

  const handleStatusModalClose = () => {
    onSuccessModalClose();
    setStatusModalMessage(null);
    setStatusModalType(null);
  };

  return (
    <div className="p-4">
      <PageTitle title={t('attendance.title')} />
      <h2 className="text-2xl my-1 font-bold text-center">
        {t('attendance.title')}
      </h2>

      <div className="relative max-w-full">
        {fetchUsersError && ( // Keep fetch users error as alert for initial load issues
          <Alert color="danger">Error fetching users: {fetchUsersError}</Alert>
        )}

        {!isBarcodeAPISupported ? (
          <Alert
            color="warning"
            icon={<FaExclamationTriangle />}
            className={isScanActive ? '' : 'hidden'}
          >
            {t('errors.scanner.barcodeApiNotSupportedAction')}
          </Alert>
        ) : (
          <>
            {!isCameraStreamActive && (
              <Alert
                color="warning"
                icon={<FaExclamationTriangle />}
                className={isScanActive ? '' : 'hidden'}
              >
                {t('errors.scanner.cameraNotActive')}
              </Alert>
            )}
          </>
        )}

        <div
          className={cn('max-w-lg mx-auto relative aspect-video', {
            hidden: !isCameraStreamActive,
          })}
        >
          <video
            id="qr-video"
            ref={videoRef}
            className="w-full"
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute inset-0 border-4 border-green-500 pointer-events-none" />
        </div>
      </div>

      {/* Scan Error Modal */}
      <Modal isOpen={scanErrorModalOpen} onClose={handleScanErrorModalClose}>
        <ModalContent>
          <ModalHeader>
            <FaTimesCircle className="mr-2 mt-[5px] inline-block text-red-500" />
            {t('errors.error')}
          </ModalHeader>
          <ModalBody>
            <p>{scanErrorMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={handleScanErrorModalClose}>
              {t('common.ok')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success/Status Modal - now handles both success and error */}
      <Modal isOpen={isSuccessModalOpen} onClose={handleStatusModalClose}>
        <ModalContent>
          <ModalHeader>
            {statusModalType === 'success' && (
              <>
                <FaCheckCircle className="mr-2 inline-block text-green-500" />
                {t('common.success')}
              </>
            )}
            {statusModalType === 'error' && (
              <>
                <FaTimesCircle className="mr-2 mt-[5px] inline-block text-red-500" />
                {t('errors.error')}
              </>
            )}
            {statusModalType === 'warning' && (
              <>
                <FaExclamationTriangle className="mr-2 inline-block text-yellow-500" />
                {t('common.warning')}
              </>
            )}
            {!statusModalType && t('attendance.modal.header')}{' '}
            {/* Default header if type is not set */}
          </ModalHeader>
          <ModalBody>
            {isLoadingUsers && statusModalType !== 'error' ? ( // Show spinner only for loading and not error from loading
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : userData && statusModalType !== 'error' ? (
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
            ) : statusModalMessage ? (
              <p>{statusModalMessage}</p> // Display status message for both success and error
            ) : (
              <p>{t('attendance.modal.fetchingUser')}</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={handleStatusModalClose}>
              {t('common.cancel')}
            </Button>
            {statusModalType !== 'error' && ( // Conditionally show confirm button if it's not an error modal
              <Button
                color="primary"
                onPress={handleConfirmAttendance}
                isLoading={isLoggingAttendance}
                isDisabled={!userData}
              >
                {t('common.save')}
              </Button>
            )}
            {statusModalType === 'error' && ( // For error modal only OK button
              <Button color="danger" onPress={handleStatusModalClose}>
                {t('common.ok')}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {!isScanActive ? (
        <div className="mt-5 flex justify-center">
          <Button color="primary" onPress={startScan}>
            {t('attendance.startScan')}
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex justify-center">
          <Button onPress={handleStopScanButton}>
            {t('attendance.stopScan')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScanAttendanceQr;
