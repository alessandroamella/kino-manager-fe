import { cn } from '@/lib/utils';
import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { Member } from '@/types/Member';
import { OpeningDayWithAttendees } from '@/types/OpeningDay';
import { dateFnsLang } from '@/utils/dateFnsLang';
import downloadStreamedFile from '@/utils/download';
import {
  addToast,
  Alert,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import { isAfter } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { clamp } from 'lodash-es';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiQr } from 'react-icons/bi';
import { FaExclamationTriangle, FaUsers } from 'react-icons/fa';
import AttendanceModal from './AttendanceModal'; // Import the modal

const dateFormat = 'dd/MM/yyyy HH:mm';
const dateFormatLong = 'eeee d MMMM yyyy';

const DateEntry = ({ date }: { date: Date }) => {
  const { i18n } = useTranslation();

  return (
    <div>
      <p
        className={cn({
          'text-foreground-500': isAfter(new Date(), date),
          'font-semibold': !isAfter(new Date(), date),
        })}
      >
        {formatInTimeZone(date, 'Europe/Rome', dateFormat, {
          locale: dateFnsLang(i18n),
        })}
      </p>
      <small
        className={cn('text-foreground-600', {
          'text-foreground-500': isAfter(new Date(), date),
        })}
      >
        {formatInTimeZone(date, 'Europe/Rome', dateFormatLong, {
          locale: dateFnsLang(i18n),
        })}
      </small>
    </div>
  );
};

interface AttendanceTableProps {
  openingDays: OpeningDayWithAttendees[];
  users: Member[];
  isLoading: boolean;
  error: string | null;
}

const AttendanceTable = ({
  openingDays,
  users,
  isLoading,
  error,
}: AttendanceTableProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<OpeningDayWithAttendees | null>(null);

  const handleViewAttendance = (event: OpeningDayWithAttendees) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null); // Clear selected event when closing
  };

  const columns = [
    { key: 'id', label: 'items.id' },
    { key: 'name', label: 'attendance.eventName' },
    { key: 'openTime', label: 'attendance.openTime' },
    { key: 'closeTime', label: 'attendance.closeTime' },
    { key: 'participants', label: 'attendance.participants' },
    { key: 'actions', label: 'admin.actions' },
  ];

  const token = useUserStore((state) => state.accessToken);

  const downloadQrCode = useCallback(
    async (eventId: number) => {
      if (!token) {
        console.error('No token available');
        addToast({
          title: t('errors.error'),
          description: t('errors.auth.auth.noTokenProvided'),
          color: 'danger',
        });
        return;
      }

      addToast({
        title: t('attendance.downloadQrToast'),
        color: 'primary',
      });

      try {
        downloadStreamedFile({
          url: `v1/attendance/event-qr/${eventId}`,
          filename: `event-qr-${eventId}.png`,
          token,
        });
      } catch (err) {
        console.error(err);
        addToast({
          title: t('errors.error'),
          description: getErrorMsg(err),
          color: 'danger',
        });
        window.alert('Error downloading event QR: ' + getErrorMsg(err));
      }
    },
    [t, token],
  );

  return isLoading ? (
    <div className="flex justify-center items-center h-48">
      <Spinner size="lg" />
    </div>
  ) : error || !openingDays ? (
    <Alert
      color="danger"
      className="mb-4"
      title={t('errors.error')}
      icon={<FaExclamationTriangle />}
    >
      {error || t('attendance.noEvents')}
    </Alert>
  ) : (
    <>
      <h1 className="text-2xl font-bold mb-4">{t('attendance.title')}</h1>
      <div className="w-full overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
        <Table
          isVirtualized
          rowHeight={60} // Slightly taller for badge
          maxTableHeight={clamp(openingDays.length, 1, 6) * 70} // Adjust multiplier
          isStriped
          aria-label={t('attendance.tableAriaLabel')}
          className="table"
        >
          <TableHeader>
            {columns.map((column) => (
              <TableColumn key={column.key}>{t(column.label)}</TableColumn>
            ))}
          </TableHeader>
          <TableBody
            items={openingDays}
            loadingContent={<Spinner />}
            isLoading={isLoading} // Should be false here due to outer check, but good practice
            emptyContent={t('attendance.noEvents')}
          >
            {(item) => {
              return (
                <TableRow key={item.id}>
                  {(columnKey) => {
                    const cellValue = () => {
                      switch (columnKey) {
                        case 'id':
                          return item.id;
                        case 'name':
                          return item.name || t('attendance.defaultEventName');
                        case 'openTime':
                          return <DateEntry date={item.openTimeUTC} />;
                        case 'closeTime':
                          return <DateEntry date={item.closeTimeUTC} />;
                        case 'participants':
                          return Number.isInteger(item.attendances.length)
                            ? item.attendances.length
                            : '-';
                        case 'actions':
                          return (
                            <div className="flex gap-2">
                              <Tooltip
                                content={t('attendance.viewAttendanceTooltip')}
                              >
                                <Button
                                  color="primary"
                                  variant="flat"
                                  isIconOnly
                                  onPress={() => handleViewAttendance(item)}
                                  aria-label={t(
                                    'attendance.viewAttendanceAction',
                                    {
                                      eventName:
                                        item.name ||
                                        t('attendance.defaultEventName'),
                                    },
                                  )}
                                >
                                  <FaUsers />
                                </Button>
                              </Tooltip>
                              <Tooltip
                                content={t('attendance.downloadQrTooltip')}
                              >
                                <Button
                                  color="primary"
                                  variant="flat"
                                  isIconOnly
                                  onPress={() => downloadQrCode(item.id)}
                                  aria-label={t(
                                    'attendance.downloadQrTooltip',
                                    {
                                      eventName:
                                        item.name ||
                                        t('attendance.defaultEventName'),
                                    },
                                  )}
                                >
                                  <BiQr />
                                </Button>
                              </Tooltip>
                            </div>
                          );
                        default:
                          return null;
                      }
                    };
                    return <TableCell>{cellValue()}</TableCell>;
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>

      {/* Render the Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        users={users}
      />
    </>
  );
};

export default AttendanceTable;
