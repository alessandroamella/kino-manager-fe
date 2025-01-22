import { CalendarDate } from '@heroui/react';
import { CalendarDate as ICalendarDate } from '@internationalized/date';
import { getYear, getMonth, getDay } from 'date-fns';

export function dateToCalendarDate(date: Date): CalendarDate {
  return new ICalendarDate(
    getYear(date),
    getMonth(date) + 1,
    getDay(date),
  ) as unknown as CalendarDate;
}

export function calendarDate(date: ICalendarDate): CalendarDate {
  return date as unknown as CalendarDate;
}
