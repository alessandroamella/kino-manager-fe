import MediaViewerModal from '@/components/media/MediaViewerModal';

const ViewSignatureModal = ({
  signatureKey,
  setSignatureKey,
}: {
  signatureKey: string | null;
  setSignatureKey: (signatureKey: string | null) => void;
}) => {
  return (
    <MediaViewerModal
      mediaKey={signatureKey}
      setMediaKey={setSignatureKey}
      apiEndpoint="/v1/admin/signature"
      modalTitleKey="signup.signature"
    />
  );
};

export default ViewSignatureModal;
