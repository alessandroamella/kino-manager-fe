import { AxiosError } from 'axios';

export const getErrorMsg = (error: unknown): string => {
  return String(
    (error as AxiosError<{ message: string }>).response?.data?.message ||
      (error as Error)?.message ||
      'An error occurred',
  );
};
