import { UTCDate } from '@date-fns/utc';
import { BaseDocument } from './BaseDocument';

export interface OpeningDayResponse extends Pick<BaseDocument, 'id'> {
  openTimeUTC: string;
  closeTimeUTC: string;
}

export interface OpeningDay extends Pick<BaseDocument, 'id'> {
  openTimeUTC: UTCDate;
  closeTimeUTC: UTCDate;
}
