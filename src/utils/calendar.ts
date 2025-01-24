import { CalendarDate } from '@heroui/react';
import {
  CalendarDateTime,
  CalendarDate as ICalendarDate,
} from '@internationalized/date';
import {
  getYear,
  getMonth,
  getDate,
  getHours,
  getMinutes,
  getSeconds,
} from 'date-fns';

export function dateToCalendarDate(date: Date): CalendarDate {
  return new ICalendarDate(
    getYear(date),
    getMonth(date) + 1,
    getDate(date),
  ) as unknown as CalendarDate;
}

export function dateToCalendarDateTime(date: Date): CalendarDateTime {
  return new CalendarDateTime(
    getYear(date),
    getMonth(date) + 1,
    getDate(date),
    getHours(date),
    getMinutes(date),
    getSeconds(date),
  );
}

export function calendarDate(date: ICalendarDate): CalendarDate {
  // HeroUI is stupid (ICalendarDate is the same as CalendarDate)
  return date as unknown as CalendarDate;
}
