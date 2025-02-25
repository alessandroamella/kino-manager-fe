import MediaViewerModal from '../media/MediaViewerModal';

const ViewExpensePictureModal = ({
  pictureKey,
  setPictureKey,
}: {
  pictureKey: string | null;
  setPictureKey: (pictureKey: string | null) => void;
}) => {
  return (
    <MediaViewerModal
      mediaKey={pictureKey}
      setMediaKey={setPictureKey}
      apiEndpoint="/v1/expense/picture"
      modalTitleKey="media.picture"
    />
  );
};

export default ViewExpensePictureModal;
