import { UTCDate } from '@date-fns/utc';
import { BaseDocument } from './BaseDocument';

export interface OpeningDayWithPictures extends Pick<BaseDocument, 'id'> {
  name: string | null;
  openTimeUTC: UTCDate;
  closeTimeUTC: UTCDate;
  eventThumbnailUrl: string | null;
  eventPicturesUrl: string | null;
}

export type OpeningDay = Omit<OpeningDayWithPictures, 'eventPicturesUrl'>;

export interface OpeningDayWithAttendees extends OpeningDay {
  attendances: {
    memberId: number;
    checkInUTC: UTCDate;
  }[];
}
