import { UTCDate } from '@date-fns/utc';
import { BaseDocument } from './BaseDocument';

export interface OpeningDay extends Pick<BaseDocument, 'id'> {
  name: string | null;
  openTimeUTC: UTCDate;
  closeTimeUTC: UTCDate;
}

export interface OpeningDayWithAttendees extends OpeningDay {
  attendances: {
    memberId: number;
    checkInUTC: UTCDate;
  }[];
}
