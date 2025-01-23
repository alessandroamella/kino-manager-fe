import { CalendarDate } from '@heroui/react';
import { CalendarDate as ICalendarDate } from '@internationalized/date';
import { getYear, getMonth, getDate } from 'date-fns';

export function dateToCalendarDate(date: Date): CalendarDate {
  return new ICalendarDate(
    getYear(date),
    getMonth(date) + 1,
    getDate(date),
  ) as unknown as CalendarDate;
}

export function calendarDate(date: ICalendarDate): CalendarDate {
  // HeroUI is stupid (ICalendarDate is the same as CalendarDate)
  return date as unknown as CalendarDate;
}
