import { Attendance } from './Attendance';
import { OpeningDayWithPictures } from './OpeningDay';

export interface AttendedEvent extends Pick<Attendance, 'checkInUTC'> {
  openingDay: Pick<
    OpeningDayWithPictures,
    'name' | 'openTimeUTC' | 'eventPicturesUrl' | 'eventThumbnailUrl'
  >;
}
