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
import 'barcode-detector/polyfill';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const [isBarcodeAPISupported, setIsBarcodeAPISupported] =
    useState<boolean>(false); // Initially false, updated after checking support
  const [isCameraStreamActive, setIsCameraStreamActive] =
    useState<boolean>(false);

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
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true; // Track component mounted state

    const checkBarcodeSupportAndStartCamera = async () => {
      setIsBarcodeAPISupported(false); // Reset to false initially

      try {
        const supportedFormats = await BarcodeDetector.getSupportedFormats();
        console.log('Supported Barcode Formats (polyfill):', supportedFormats);
        if (!supportedFormats.includes('qr_code')) {
          console.warn(
            'QR code format not supported by BarcodeDetector polyfill.',
          );
          if (isMounted) {
            setScanError(t('errors.scanner.qrCodeNotSupported'));
            setIsBarcodeAPISupported(false);
          }
          return; // Stop further execution if QR code is not supported
        }

        if (isMounted) {
          setIsBarcodeAPISupported(true);
        }
        barcodeDetectorRef.current = new BarcodeDetector({
          formats: ['qr_code'],
        });

        // Start camera only after confirming barcode API support
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          console.log('Camera stream:', stream);
          if (isMounted && videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraStreamActive(true);
          } else if (!videoRef.current) {
            console.error('Video element ref is not available');
            if (isMounted) {
              setScanError(t('errors.scanner.videoElementError'));
              setIsCameraStreamActive(false);
            }
          }
        } catch (cameraError) {
          console.error('Error accessing camera:', cameraError);
          if (isMounted) {
            setScanError(t('errors.scanner.cameraAccessError'));
            setIsCameraStreamActive(false);
          }
        }
      } catch (error) {
        console.error(
          'Error getting supported formats from BarcodeDetector polyfill:',
          error,
        );
        if (isMounted) {
          setScanError(t('errors.scanner.barcodeApiError'));
          setIsBarcodeAPISupported(false);
        }
      }
    };

    checkBarcodeSupportAndStartCamera();

    return () => {
      isMounted = false; // Set flag to indicate component unmounted
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoElement = videoRef.current;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
        setIsCameraStreamActive(false);
      }
    };
  }, [t]);

  const handleBarcodeScan = useCallback(
    async (rawValue: string) => {
      if (isOpen) {
        console.debug('Modal is already open, ignoring scan result');
        return;
      }

      setScanError(null);
      setJwt(rawValue);

      try {
        const jwtPayload = jwtDecode<{ u: number; iat: number; exp: number }>(
          rawValue,
        );
        if (!jwtPayload) {
          setScanError('Invalid QR code');
          console.error('Invalid QR code:', rawValue);
          return;
        }
        console.log('Decoded QR code payload:', jwtPayload);

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
          setScanError(t('errors.scanner.auth.userNotFound'));
          console.error(
            'User not found in fetched users:',
            jwtPayload.u,
            'users:',
            users,
          );
        }
        navigator.vibrate?.(400);
      } catch (error) {
        setScanError('Invalid QR code format or content');
        console.error('Error decoding or processing QR code:', error);
      }
    },
    [isOpen, onOpen, t],
  );

  // Barcode detection effect - starts only when camera stream is active and barcode API is supported
  useEffect(() => {
    if (!isBarcodeAPISupported || !isCameraStreamActive) return;

    const detectBarcode = async () => {
      if (
        !videoRef.current ||
        videoRef.current.readyState < 2 ||
        !barcodeDetectorRef.current ||
        isOpen
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
              return; // Stop scanning after successful detection and processing
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
          // Ignore AbortError which can happen during rapid component unmount
          console.error('Barcode detection error:', error);
          setScanError(t('errors.scanner.barcodeDetectionError'));
        }
      } finally {
        if (!isOpen) {
          // Continue scanning only if modal is not open
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
    isCameraStreamActive,
    isOpen,
    t,
  ]);

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
        {scanError && <Alert color="danger">{scanError}</Alert>}
        {logAttendanceError && (
          <Alert color="danger">
            Error logging attendance: {logAttendanceError}
          </Alert>
        )}
        {fetchUsersError && (
          <Alert color="danger">Error fetching users: {fetchUsersError}</Alert>
        )}

        {!isBarcodeAPISupported ? (
          <Alert color="warning">
            {t('errors.scanner.barcodeApiNotSupportedAction')}
          </Alert>
        ) : (
          <>
            {!isCameraStreamActive && (
              <Alert color="warning">
                {t('errors.scanner.cameraNotActive')}
              </Alert>
            )}
            <div className="max-w-lg mx-auto relative aspect-video">
              <video
                id="qr-video"
                ref={videoRef}
                className="w-full"
                autoPlay
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 border-4 border-green-500 pointer-events-none" />{' '}
            </div>
          </>
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
