import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from '@heroui/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// Import icons
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { useSearchParams } from 'react-router';

const LogAttendanceModal = ({
  fetchAttendedEvents,
}: {
  fetchAttendedEvents: (token: string) => void;
}) => {
  const { t } = useTranslation();

  const token = useUserStore((store) => store.accessToken);
  const user = useUserStore((store) => store.user);

  const [search, setSearch] = useSearchParams();
  const checkInJwtPayload = search.get('check-in');

  // --- State for Modal Content ---
  const [isLoading, setIsLoading] = useState(true); // Start loading when modal potentially opens
  const [checkInError, setCheckInError] = useState<string | null>(null);
  // Success is implied when !isLoading && !checkInError

  // --- API Call Logic (modified to update state) ---
  const checkInToEvent = useCallback(
    async (jwtPayload: string) => {
      // Reset state for a new attempt
      setIsLoading(true);
      setCheckInError(null);

      if (!token || !user) {
        const errorMsg = t('errors.auth.noTokenOrUser');
        console.error('No token or user provided to checkInToEvent:', errorMsg);
        setCheckInError(errorMsg);
        setIsLoading(false);
        return;
      }

      try {
        await axios.post(
          `/v1/attendance/check-in/${jwtPayload}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // Success!
        console.log('Checked in to event successfully');
        // No need to set success state explicitly, absence of error implies success

        fetchAttendedEvents(token); // Fetch attended events after successful check-in
      } catch (err) {
        const errorMsg = getErrorMsg(err);
        console.error('Error checking in to event:', errorMsg);
        setCheckInError(errorMsg);
      } finally {
        // Always stop loading
        setIsLoading(false);
      }
    },
    [fetchAttendedEvents, t, token, user], // Keep dependencies that affect the function's behavior
  );

  // --- Effect to Trigger Check-in ---
  useEffect(() => {
    // Only run if the payload exists
    if (checkInJwtPayload) {
      checkInToEvent(checkInJwtPayload);
    } else {
      // If payload disappears (e.g., manual URL edit), ensure loading stops
      setIsLoading(false);
      setCheckInError(null);
    }
    // We only want this effect to re-run if the *specific* checkInJwtPayload changes
    // or if the function to perform the check-in changes (due to token/user/t changes)
  }, [checkInJwtPayload, checkInToEvent]);

  // --- Modal Control ---
  const closeModal = useCallback(() => {
    // Clear the search param which controls the modal's visibility
    search.delete('check-in');
    setSearch(search, { replace: true }); // Use replace to avoid history clutter
    // Reset state when closing manually
    setIsLoading(false); // Ensure loading is off
    setCheckInError(null);
  }, [search, setSearch]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeModal();
      }
      // Note: Modal opening is controlled by `isOpen` derived from `checkInJwtPayload`
    },
    [closeModal],
  );

  // Modal is open if the check-in JWT exists in the URL
  const isOpen = !!checkInJwtPayload;

  // --- Determine Modal Content based on State ---
  let modalTitle = '';
  let modalBodyContent = null;

  if (isLoading) {
    modalTitle = t('common.loading');
    modalBodyContent = (
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Spinner size="lg" color="primary" />
        <p>{t('common.loading')}</p>
      </div>
    );
  } else if (checkInError) {
    modalTitle = t('errors.error');
    modalBodyContent = (
      <Alert color="danger" icon={<FiAlertTriangle className="h-5 w-5" />}>
        <p>{t('attendance.checkInFailed')}</p>
        <p className="font-mono text-sm mt-2 bg-danger-50 dark:bg-danger-900 p-2 rounded">
          {checkInError}
        </p>
      </Alert>
    );
  } else {
    // Success state
    modalTitle = t('attendance.checkedIn', {
      context: user?.gender === 'M' ? 'male' : 'female', // Use optional chaining for user
    });
    modalBodyContent = (
      <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
        <FiCheckCircle className="h-12 w-12 text-success-500" />
        <p className="text-lg font-medium">
          {t('attendance.checkedInSuccess')}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('attendance.canCloseWindow')}
        </p>
      </div>
    );
  }

  return (
    // Conditionally render the Modal based on isOpen derived from search param
    // or always render and control visibility via isOpen prop.
    // The latter is often better for transitions and state persistence if needed,
    // but requires careful state reset. Here, isOpen controls mounting.
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {/* We use the onClose provided by ModalContent for the buttons */}
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {modalTitle}
            </ModalHeader>
            <ModalBody>{modalBodyContent}</ModalBody>
            <ModalFooter>
              {/* Always show a close button. Text might change based on state */}
              <Button
                color={checkInError ? 'danger' : 'primary'}
                // variant={isLoading ? 'light' : 'solid'} // Optional: style differently while loading
                onPress={onClose} // Use the provided onClose which triggers our closeModal via onOpenChange
                isDisabled={isLoading} // Disable button while loading
              >
                {isLoading
                  ? t('common.loading') // Or hide button?
                  : checkInError
                  ? t('common.close')
                  : t('common.ok')}
              </Button>
              {/* Remove the placeholder Action button */}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LogAttendanceModal;
