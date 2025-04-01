import { AttendedEvent } from '@/types/AttendedEvent';
import { dateFnsLang } from '@/utils/dateFnsLang';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Image,
  Link,
} from '@heroui/react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegClock } from 'react-icons/fa';
import { IoMdPhotos } from 'react-icons/io';
import { MdOutlineEventAvailable } from 'react-icons/md';

const AttendedEventCard = ({
  attendedEvent,
}: {
  attendedEvent: AttendedEvent;
}) => {
  const { i18n, t } = useTranslation();
  const { openingDay, checkInUTC } = attendedEvent;

  const eventDate = useMemo(
    () => new Date(openingDay.openTimeUTC),
    [openingDay.openTimeUTC],
  );
  const formattedEventDate = useMemo(
    () =>
      format(eventDate, 'EEEE, MMMM do yyyy', {
        locale: dateFnsLang(i18n),
      }),
    [eventDate, i18n],
  );
  const formattedEventTime = useMemo(
    () =>
      format(eventDate, 'h:mm a', {
        locale: dateFnsLang(i18n),
      }),
    [eventDate, i18n],
  );

  // Format check-in time
  const checkInDate = useMemo(() => new Date(checkInUTC), [checkInUTC]);

  const formattedCheckInTime = useMemo(
    () =>
      format(checkInDate, 'h:mm a', {
        locale: dateFnsLang(i18n),
      }),
    [checkInDate, i18n],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="max-w-[300px] md:max-w-[400px] overflow-hidden">
        <CardHeader className="flex flex-col gap-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold">{openingDay.name}</h2>
            <MdOutlineEventAvailable size={24} />
          </div>
          <p className="text-sm font-medium opacity-90">{formattedEventDate}</p>
        </CardHeader>

        {openingDay.eventThumbnailUrl ? (
          <div className="relative w-full h-[200px] overflow-hidden">
            <Image
              alt={`${openingDay.name} ${t('attendedEvent.thumbnail')}`}
              src={openingDay.eventThumbnailUrl}
              className="w-full h-full object-cover"
              radius="none"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white text-sm font-medium">
                {t('attendedEvent.youWereThere')} 🎉
              </p>
            </div>
          </div>
        ) : (
          <CardBody>
            <div className="space-x-3 grid grid-cols-2 items-center">
              <div className="flex items-center gap-2">
                <FaRegClock className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t('attendedEvent.eventTime')}
                  </p>
                  <p className="text-xs text-gray-500">{formattedEventTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FaRegClock className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t('attendedEvent.yourCheckIn')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formattedCheckInTime}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        )}

        <Divider />

        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IoMdPhotos size={20} className="text-blue-500" />
            <span className="text-sm">
              {t('attendedEvent.viewEventPhotos')}
            </span>
          </div>

          {openingDay.eventPicturesUrl && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                as={Link}
                href={openingDay.eventPicturesUrl}
                isExternal
                color="primary"
                size="md"
                startContent={<IoMdPhotos />}
                className="min-w-fit px-4"
              >
                {t('attendedEvent.openGallery')}
              </Button>
              <motion.div
                className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-xs font-bold">!</span>
              </motion.div>
            </motion.div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default AttendedEventCard;
