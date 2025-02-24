import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { Alert, Image, Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';
import axios, { AxiosError } from 'axios';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, Navigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';

const AttendanceQr = () => {
  const accessToken = useUserStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);
  const tokenLoading = useUserStore((state) => state.loading);

  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const pollingIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  const location = useLocation();
  const { t } = useTranslation();

  const checkAttendanceStatus = async () => {
    if (!accessToken || isCheckedIn) {
      // even if it's null, it's safe to call clearInterval
      clearInterval(pollingIntervalId.current!);
      pollingIntervalId.current = null;
      return;
    }
    try {
      await axios.get('/v1/attendance/is-checked-in', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setIsCheckedIn(true);
      setSuccessAlert(t('attendance.checkedInSuccess'));
      navigator.vibrate?.(400);
      clearInterval(pollingIntervalId.current!);
      pollingIntervalId.current = null;
    } catch (err) {
      if ((err as AxiosError).response?.status === 404) {
        // not checked in yet, continue polling silently
        console.log('Not checked in yet');
      } else {
        console.error(
          'Error checking attendance status:',
          getErrorMsg(err),
          err,
        );
        // optionally handle other errors, maybe stop polling or show error message
      }
    }
  };

  useEffect(() => {
    async function fetchQrImage() {
      if (!accessToken || qrLoading) return;
      await checkAttendanceStatus();
      setQrLoading(true);
      setError(null);
      try {
        const { data } = await axios.post('/v1/attendance/qr-code', null, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'blob',
        });

        const imageUrl = URL.createObjectURL(data);
        setQrImageUrl(imageUrl);
      } catch (err) {
        console.error('Error fetching QR code:', getErrorMsg(err), err);
        setError(getErrorMsg(err));
      } finally {
        setQrLoading(false);
      }
    }

    if (isModalOpen && accessToken && !qrImageUrl && !qrLoading) {
      fetchQrImage();
    }

    if (
      isModalOpen &&
      accessToken &&
      !isCheckedIn &&
      !pollingIntervalId.current
    ) {
      pollingIntervalId.current = setInterval(checkAttendanceStatus, 1000); // Start polling every second
    }

    return () => {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isModalOpen, isCheckedIn]); // isCheckedIn added to dependency array to stop polling when checked in

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsCheckedIn(false); // Reset check-in status when modal opens again
    setSuccessAlert(null); // Clear success alert when modal opens again
    setError(null); // Clear any previous errors
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (qrImageUrl) {
      URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(null);
    }
    setError(null);
    setIsCheckedIn(false);
    setSuccessAlert(null);
    if (pollingIntervalId.current) {
      clearInterval(pollingIntervalId.current);
      pollingIntervalId.current = null;
    }
  };

  return (
    <div>
      <Button onPress={handleOpenModal} color="primary">
        {t('attendance.showQrCode')}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClose={handleCloseModal}
        size="lg"
      >
        <ModalContent className="rounded-xl shadow-lg">
          <ModalHeader>
            <ModalHeader>{t('attendance.title')}</ModalHeader>
          </ModalHeader>
          <ModalBody>
            {error && (
              <Alert className="mb-4" color="danger" title={t('errors.error')}>
                {error}
              </Alert>
            )}
            {successAlert && (
              <Alert
                className="mb-4"
                color="success"
                title={t('common.success')}
              >
                {successAlert}
              </Alert>
            )}
            {qrImageUrl ? (
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  className={`relative w-80 p-1 rounded-xl ${
                    isCheckedIn ? 'bg-green-500' : ''
                  }`}
                  animate={
                    !isCheckedIn
                      ? {
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }
                      : {}
                  }
                  transition={
                    !isCheckedIn
                      ? { repeat: Infinity, duration: 3, ease: 'linear' }
                      : {}
                  }
                  style={
                    !isCheckedIn
                      ? {
                          background:
                            'linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff)',
                          backgroundSize: '200% 200%',
                        }
                      : {}
                  }
                >
                  <div className="relative rounded-xl bg-white p-2">
                    <Image
                      src={qrImageUrl}
                      alt="Attendance QR Code"
                      className="max-w-full w-80 rounded-xl object-contain"
                      style={{
                        filter: isCheckedIn
                          ? 'grayscale(100%) brightness(1.2)'
                          : 'none',
                      }}
                    />
                  </div>
                </motion.div>
                <p className="my-4 text-sm text-foreground-500">
                  {isCheckedIn
                    ? t('attendance.checkedIn', {
                        context: user?.gender === 'M' ? 'male' : 'female',
                      })
                    : t('attendance.scanQrCode')}
                </p>
              </div>
            ) : !error && accessToken && !tokenLoading && qrLoading ? (
              <div className="mx-auto mb-4 rounded-xl w-80 h-80 bg-background-600 animate-pulse" />
            ) : !error && !accessToken && !tokenLoading ? (
              <Navigate
                to={{
                  pathname: '/auth/login',
                  search: createSearchParams({
                    to: location.pathname,
                  }).toString(),
                }}
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      {!isModalOpen && !accessToken && !tokenLoading && !error && (
        <Navigate
          to={{
            pathname: '/auth/login',
            search: createSearchParams({
              to: location.pathname,
            }).toString(),
          }}
        />
      )}
    </div>
  );
};

export default AttendanceQr;
