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
  Button,
} from '@heroui/react';
import { getErrorMsg } from '../../types/error';
import useUserStore from '@/store/user';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { AiOutlineZoomIn, AiOutlineZoomOut } from 'react-icons/ai';

interface MediaViewerModalProps {
  mediaKey: string | null;
  setMediaKey: (mediaKey: string | null) => void;
  apiEndpoint: string;
  modalTitleKey: string;
}

const MediaViewerModal = ({
  mediaKey,
  setMediaKey,
  apiEndpoint,
  modalTitleKey,
}: MediaViewerModalProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const token = useUserStore((store) => store.accessToken);
  const { t } = useTranslation();

  useEffect(() => {
    async function showMedia() {
      if (!token) {
        setError('No token provided to show media');
        return;
      } else if (!mediaKey) {
        return;
      }
      try {
        console.log(`Fetching media from ${apiEndpoint}:`, mediaKey);

        const response = await axios.get<Blob>(
          `${apiEndpoint}/${encodeURIComponent(mediaKey)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          },
        );

        const imageUrl = URL.createObjectURL(response.data);
        console.log('Response size:', response.data.size);
        setMediaUrl(imageUrl);
        setError(null);
        setRotation(0); // Reset rotation when new media is loaded
        setZoom(1); // Reset zoom when new media is loaded
      } catch (err) {
        console.error('Error fetching media:', getErrorMsg(err));
        setError(getErrorMsg(err));
      } finally {
        setLoading(false);
      }
    }

    showMedia();
  }, [mediaKey, token, apiEndpoint]);

  const closeMediaModal = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
      setMediaUrl(null);
    }
    setError(null);
    setMediaKey(null);
    setRotation(0); // Reset rotation on modal close
    setZoom(1); // Reset zoom on modal close
  };

  const rotateLeft = () => {
    setRotation((prevRotation) => prevRotation - 90);
  };

  const rotateRight = () => {
    setRotation((prevRotation) => prevRotation + 90);
  };

  const zoomIn = () => {
    setZoom((prevZoom) => prevZoom + 0.1);
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(1, prevZoom - 0.1)); // Prevent zoom less than 1
  };

  return (
    <Modal isOpen={!!mediaKey} onClose={closeMediaModal} size="xl">
      <ModalContent>
        <ModalHeader>{t(modalTitleKey)}</ModalHeader>
        <ModalBody
          className={cn('mx-auto mb-4 flex flex-col items-center', {
            'w-full': loading || !mediaUrl,
          })}
        >
          {!loading && error ? (
            <Alert color="danger" title={t('errors.error')}>
              {error}
            </Alert>
          ) : mediaUrl ? (
            <>
              <div className="relative overflow-hidden w-full max-w-full flex items-center md:h-[70vh] max-h-[70vh] overflow-y-auto">
                <Image
                  src={mediaUrl}
                  alt="Media"
                  className="object-contain"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                    transition: 'transform 0.3s ease-out',
                  }}
                />
              </div>

              <div className="mt-4 flex space-x-2 justify-center">
                <Button size="sm" onPress={rotateLeft} aria-label="Rotate Left">
                  <FiRotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onPress={rotateRight}
                  aria-label="Rotate Right"
                >
                  <FiRotateCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onPress={zoomIn} aria-label="Zoom In">
                  <AiOutlineZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" onPress={zoomOut} aria-label="Zoom Out">
                  <AiOutlineZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Skeleton className="rounded-xl mt-1 md:mx-2 lg:mx-3">
              <div className="w-full min-w-12 h-36" />
            </Skeleton>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MediaViewerModal;
