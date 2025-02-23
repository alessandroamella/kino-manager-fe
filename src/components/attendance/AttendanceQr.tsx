import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { Alert, Image, Button } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, Navigate, useLocation } from 'react-router';

const AttendanceQr = () => {
  const accessToken = useUserStore((state) => state.accessToken);
  const tokenLoading = useUserStore((state) => state.loading);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    async function fetchQrImage() {
      if (!accessToken || qrLoading) return;
      setQrLoading(true);
      setError(null);
      try {
        const response = await axios.post('/v1/attendance/qr-code', null, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'blob',
        });

        const imageUrl = URL.createObjectURL(response.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isModalOpen]);

  const location = useLocation();
  const { t } = useTranslation();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (qrImageUrl) {
      URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(null);
    }
    setError(null);
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
            {qrImageUrl ? (
              <div className="flex flex-col items-center justify-center">
                <Image
                  src={qrImageUrl}
                  alt="Attendance QR Code"
                  className="max-w-full w-80 rounded-xl bg-white object-contain"
                />
                <p className="my-4 text-sm text-foreground-500">
                  {t('attendance.scanQrCode')}
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
