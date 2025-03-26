import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useWindowSize } from '@react-hook/window-size';
import { useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaEraser } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSaveSignature: (signatureData: string | null) => void;
}

const SignatureModal = ({
  isOpen,
  setIsOpen,
  onSaveSignature,
}: SignatureModalProps) => {
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const { t } = useTranslation();

  const [width, height] = useWindowSize();
  const isLandscape = useMemo(() => width > height, [width, height]);

  const handleErase = () => {
    signatureCanvasRef.current?.clear();
    setIsValid(false);
  };

  const [isValid, setIsValid] = useState(false);

  const handleOnEnd = () => {
    if (!signatureCanvasRef.current) {
      return;
    }
    setIsValid(signatureCanvasRef.current?.toData().length > 0);
  };

  const handleConfirm = () => {
    if (signatureCanvasRef.current?.toData().length) {
      const signatureDataUrl =
        signatureCanvasRef.current.toDataURL('image/webp');
      onSaveSignature(signatureDataUrl);
    } else {
      onSaveSignature(null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    onSaveSignature(null);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="xl">
      <ModalContent className="bg-background dark:bg-background-dark shadow-lg rounded-md p-4">
        <ModalHeader className="flex justify-between items-center py-2 px-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {t('signature.modalHeader')}
          </span>
        </ModalHeader>
        <ModalBody className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('signature.instructions')}
          </p>
          {isMobile && !isLandscape ? (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-md">
              <p className="font-bold">{t('signature.rotateDeviceTitle')}</p>
              <p>{t('signature.rotateDeviceMessage')}</p>
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
              <SignatureCanvas
                ref={signatureCanvasRef}
                backgroundColor="white"
                penColor="black"
                onBegin={() => setIsValid(true)}
                onEnd={() => handleOnEnd()}
                canvasProps={{
                  width: 500,
                  height: 150,
                  className: 'rounded-md',
                }}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter className="flex justify-end py-3 px-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="flat"
            color="secondary"
            onPress={handleCancel}
            className="mr-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button color="danger" onPress={handleErase} className="mr-2">
            <FaEraser className="h-4 w-4 mr-2" />
            {t('signature.erase')}
          </Button>
          <Button
            color="success"
            className="dark:text-white"
            onPress={handleConfirm}
            isDisabled={!isValid}
          >
            <FaCheck className="h-4 w-4 mr-2" /> {t('common.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SignatureModal;
