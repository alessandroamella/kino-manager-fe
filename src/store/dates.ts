import { OpeningDay } from '@/types/OpeningDay';
import { UTCDateMini } from '@date-fns/utc';
import axios from 'axios';
import { isAfter, isBefore } from 'date-fns';
import { create } from 'zustand';

interface OpeningDatesState {
  dates: OpeningDay[];
  isLoading: boolean;
  error: string | null;
  nextOpeningDate: OpeningDay | null;
  fetchDates: () => Promise<void>;
  getCurrentDate: () => Date;
}

const useOpeningDatesStore = create<OpeningDatesState>((set, get) => ({
  dates: [],
  isLoading: false,
  error: null,
  nextOpeningDate: null,
  getCurrentDate: () => new Date(), // For testing purposes

  fetchDates: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.get<OpeningDay[]>('/v1/opening-day');

      const dates = data.map((day) => ({
        id: day.id,
        name: day.name,
        openTimeUTC: new UTCDateMini(day.openTimeUTC),
        closeTimeUTC: new UTCDateMini(day.closeTimeUTC),
      }));
      console.log('Fetched opening dates:', dates);

      set({
        dates,
        isLoading: false,
        nextOpeningDate: dates.find(({ openTimeUTC, closeTimeUTC }) => {
          const currentDate = get().getCurrentDate();
          return (
            (isAfter(currentDate, openTimeUTC) &&
              isBefore(currentDate, closeTimeUTC)) ||
            isBefore(currentDate, openTimeUTC)
          );
        }),
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch opening dates',
        isLoading: false,
      });
    }
  },
}));

export default useOpeningDatesStore;
