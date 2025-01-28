import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Image,
  Skeleton,
  Alert,
} from '@heroui/react';
import { getErrorMsg } from '../../types/error';
import useUserStore from '@/store/user';
import { useTranslation } from 'react-i18next';

const AdminViewSignatureModal = ({
  signatureKey,
  setSignatureKey,
}: {
  signatureKey: string | null;
  setSignatureKey: (signatureKey: string | null) => void;
}) => {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = useUserStore((store) => store.accessToken);

  useEffect(() => {
    async function showSignature() {
      if (!token) {
        setError('No token provided to showSignature');
        return;
      } else if (!signatureKey) {
        setError('No signatureKey provided to showSignature');
        return;
      }
      try {
        console.log('Fetching signature:', signatureKey);

        const response = await axios.get<Blob>(
          `/v1/admin/signature/${encodeURIComponent(signatureKey)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', // Important to handle image data
          },
        );

        const imageUrl = URL.createObjectURL(response.data);
        console.log('Response size:', response.data.size);
        setSignatureUrl(imageUrl);
        setError(null);
      } catch (err) {
        console.error('Error fetching signature:', getErrorMsg(err));
        setError(getErrorMsg(err));
      }
    }

    showSignature();
  }, [signatureKey, token]);

  const closeSignatureModal = () => {
    if (signatureUrl) {
      URL.revokeObjectURL(signatureUrl); // Clean up object URL
      setSignatureUrl(null);
    }
    setError(null);
    setSignatureKey(null);
  };

  const { t } = useTranslation();

  return (
    <Modal isOpen={!!signatureKey} onClose={closeSignatureModal} size="xl">
      <ModalContent>
        <ModalHeader>{t('signup.signature')}</ModalHeader>
        <ModalBody className="mx-auto pb-4">
          {error ? (
            <Alert color="danger" title={t('errors.error')}>
              {error}
            </Alert>
          ) : signatureUrl ? (
            <Image
              src={signatureUrl}
              alt="Signature"
              className="w-full max-h-full min-h-36 object-contain"
            />
          ) : (
            <Skeleton>
              <div className="w-full h-full min-w-24 min-h-24" />
            </Skeleton>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AdminViewSignatureModal;
