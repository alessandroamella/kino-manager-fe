import { getUserStr } from '@/lib/utils';
import useUserStore from '@/store/user';
import { Attendance } from '@/types/Attendance';
import { getErrorMsg } from '@/types/error';
import { OpeningDay } from '@/types/OpeningDay';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import axios from 'axios';
import { format } from 'date-fns';
import { clamp } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaUsers } from 'react-icons/fa';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: OpeningDay | null; // Pass the full event details
}

const AttendanceModal = ({ isOpen, onClose, event }: AttendanceModalProps) => {
  const { t } = useTranslation();
  const token = useUserStore((store) => store.accessToken);

  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateFormat = useMemo(() => 'dd/MM/yyyy HH:mm', []);
  const timeFormat = useMemo(() => 'HH:mm:ss', []);

  useEffect(() => {
    if (isOpen && event?.id && token) {
      const fetchAttendance = async () => {
        setIsLoading(true);
        setError(null);
        setAttendanceData([]); // Clear previous data
        try {
          const { data } = await axios.get<Attendance[]>(
            `/v1/attendance/event/${event.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setAttendanceData(data);
        } catch (err) {
          console.error('Error fetching attendance:', err);
          setError(getErrorMsg(err));
        } finally {
          setIsLoading(false);
        }
      };
      fetchAttendance();
    } else if (!isOpen) {
      // Clear state when modal closes
      setAttendanceData([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, event?.id, token]);

  const eventName = event?.name || t('attendance.defaultEventName');

  const columns = [
    { key: 'member', label: 'attendance.modal.member' },
    { key: 'checkInTime', label: 'attendance.modal.checkInTime' },
    { key: 'memberId', label: 'attendance.modal.memberId' },
  ];

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
      <ModalContent>
        {(modalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t('attendance.modal.header', { eventName })}
              {event && (
                <span className="text-sm font-normal text-gray-500">
                  {format(event.openTimeUTC, dateFormat)}
                </span>
              )}
            </ModalHeader>
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <Alert
                  color="danger"
                  title={t('errors.error')}
                  icon={<FaExclamationTriangle />}
                >
                  {error}
                </Alert>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2 text-lg font-medium">
                    <FaUsers />
                    <span>
                      {t('attendance.modal.attendeeCount', {
                        count: attendanceData.length,
                      })}
                    </span>
                  </div>
                  <Table
                    isVirtualized
                    rowHeight={50}
                    maxTableHeight={clamp(attendanceData.length, 1, 6) * 55} // Adjust multiplier as needed
                    isStriped
                    aria-label={t('attendance.modal.ariaLabel', { eventName })}
                  >
                    <TableHeader>
                      {columns.map((column) => (
                        <TableColumn key={column.key}>
                          {t(column.label)}
                        </TableColumn>
                      ))}
                    </TableHeader>
                    <TableBody
                      items={attendanceData}
                      emptyContent={t('attendance.modal.noAttendees')}
                    >
                      {(item) => (
                        <TableRow key={item.id}>
                          {(columnKey) => {
                            switch (columnKey) {
                              case 'member':
                                return (
                                  <TableCell>
                                    {getUserStr(item.member)}
                                  </TableCell>
                                );
                              case 'checkInTime':
                                return (
                                  <TableCell>
                                    {format(item.checkInUTC, timeFormat)}
                                  </TableCell>
                                );
                              case 'memberId':
                                return <TableCell>{item.member.id}</TableCell>;
                              default:
                                return <TableCell>-</TableCell>;
                            }
                          }}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" variant="flat" onPress={modalOnClose}>
                {t('common.close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AttendanceModal;
