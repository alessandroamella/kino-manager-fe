import { getUserStr } from '@/lib/utils';
import useUserStore from '@/store/user';
import { Attendance } from '@/types/Attendance';
import { getErrorMsg } from '@/types/error';
import { Member } from '@/types/Member';
import { OpeningDayWithAttendees } from '@/types/OpeningDay';
import { dateFnsLang } from '@/utils/dateFnsLang';
import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import axios from 'axios';
import { formatInTimeZone } from 'date-fns-tz';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCopy, FaUsers } from 'react-icons/fa';

type MemberWithAttendance = Member & Pick<Attendance, 'checkInUTC'>;

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: OpeningDayWithAttendees | null;
  users: Member[];
}

const AttendanceModal = ({
  isOpen,
  onClose,
  event,
  users,
}: AttendanceModalProps) => {
  const { i18n, t } = useTranslation();

  const usersById = useMemo(() => {
    const map = new Map<number, Member>();
    users.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [users]);

  const attendees = useMemo<MemberWithAttendance[]>(() => {
    if (!event?.attendances || !usersById) {
      return [];
    }

    return event.attendances
      .map((attendanceRecord) => ({
        checkInUTC: attendanceRecord.checkInUTC,
        ...usersById.get(attendanceRecord.memberId)!,
      }))
      .filter((user) => user?.id);
  }, [event?.attendances, usersById]);

  const eventName = event?.name || t('attendance.defaultEventName');

  const columns = [
    { key: 'member', label: 'attendance.modal.member' },
    { key: 'email', label: 'profile.email' },
    { key: 'phoneNumber', label: 'profile.phoneNumber' },
    { key: 'checkInTime', label: 'attendance.modal.checkInTime' },
  ];

  const attendeeCount = attendees.length;

  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);

  const token = useUserStore((store) => store.accessToken);

  useEffect(() => {
    async function fetchCheckInUrl() {
      if (token && event) {
        try {
          const { data } = await axios.get<{ url: string }>(
            `/v1/attendance/event-checkin-url/${event.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          setCheckInUrl(data.url);
        } catch (err) {
          console.error('error', err);
          addToast({
            color: 'danger',
            title: t('errors.error'),
            description: getErrorMsg(err),
          });
        }
      }
    }

    fetchCheckInUrl();
  }, [event, t, token]);

  const copyCheckInUrl = useCallback(() => {
    if (checkInUrl) {
      navigator.clipboard?.writeText?.(checkInUrl);
      addToast({
        color: 'success',
        title: t('attendance.modal.checkInUrlCopied'),
      });
    } else {
      console.error('Check-in URL is not available');
    }
  }, [checkInUrl, t]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="4xl">
      <ModalContent>
        {(modalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t('attendance.modal.header', { eventName })}
              {event && (
                <span className="text-sm font-normal text-gray-500">
                  {formatInTimeZone(
                    event.openTimeUTC,
                    'Europe/Rome',
                    'eeee d MMMM yyyy',
                    {
                      locale: dateFnsLang(i18n),
                    },
                  )}
                </span>
              )}
            </ModalHeader>
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              {checkInUrl ? (
                <div className="mb-2 flex flex-col gap-2 text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <FaUsers />
                    <span>{t('attendance.modal.checkInUrl')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      className="w-full"
                      isReadOnly
                      value={checkInUrl}
                    />
                    <Tooltip content={t('attendance.modal.copyCheckInUrl')}>
                      <Button
                        color="primary"
                        variant="bordered"
                        onPress={copyCheckInUrl}
                        isIconOnly
                      >
                        <FaCopy />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <Skeleton>
                  <div className="mb-2 w-full h-12" />
                </Skeleton>
              )}

              <div className="mb-4 flex items-center gap-2 text-lg font-medium">
                <FaUsers />
                <span>
                  {t('attendance.modal.attendeeCount', {
                    count: attendeeCount,
                  })}
                </span>
              </div>
              <Table
                isVirtualized
                rowHeight={50}
                maxTableHeight={300}
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
                  items={attendees}
                  emptyContent={t('attendance.modal.noAttendees')}
                >
                  {(attendeeUser) => (
                    <TableRow key={attendeeUser.id}>
                      {(columnKey) => {
                        switch (columnKey) {
                          case 'member':
                            return (
                              <TableCell>{getUserStr(attendeeUser)}</TableCell>
                            );
                          case 'email':
                            return (
                              <TableCell>{attendeeUser.email || '-'}</TableCell>
                            );
                          case 'phoneNumber':
                            return (
                              <TableCell>
                                {attendeeUser.phoneNumber || '-'}
                              </TableCell>
                            );
                          case 'checkInTime':
                            return (
                              <TableCell>
                                {attendeeUser.checkInUTC
                                  ? formatInTimeZone(
                                      new Date(attendeeUser.checkInUTC),
                                      'Europe/Rome',
                                      'dd/MM/yyyy HH:mm:ss',
                                    )
                                  : '-'}
                              </TableCell>
                            );
                          // Add more cases if needed
                          default:
                            return <TableCell>-</TableCell>;
                        }
                      }}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
