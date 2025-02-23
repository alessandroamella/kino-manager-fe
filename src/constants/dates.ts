import { UTCDate, UTCDateMini } from '@date-fns/utc';
import { endOfDay, isAfter } from 'date-fns';

export const getCurrentDate = () => new Date();

// this will be fetched from DB in the future
export const getOpeningDates = async () =>
  [
    [8, 2],
    [23, 2],
    [1, 3],
    [9, 3],
    [15, 3],
    [23, 3],
    [30, 3],
    [2, 4],
    [9, 4],
    // [16,4], // skip
    [23, 4],
    [30, 4],
  ].map(([day, month]) => new UTCDateMini(2025, month - 1, day));

export const getNextDate = (dates: UTCDate[]) => {
  return (
    dates.find((date) => isAfter(endOfDay(date), getCurrentDate())) || null
  );
};
