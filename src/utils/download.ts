import axios, { isAxiosError } from 'axios';
import { saveAs } from 'file-saver';

const downloadStreamedFile = async ({
  url,
  filename,
  token,
  additionalHeaders = {},
  method = 'GET',
  onStart,
  onComplete,
}: {
  url: string;
  filename: string;
  token?: string;
  additionalHeaders?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  onStart?: () => void;
  onComplete?: () => void;
}) => {
  if (onStart) {
    onStart();
  }

  try {
    const headers = {
      ...additionalHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // Add token if provided
    };

    const response = await axios({
      url,
      method,
      headers,
      responseType: 'blob', // Important for binary data
    });

    saveAs(response.data, filename);

    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    if (onComplete) {
      onComplete(); // still call onComplete to signal end, even with error
    }
    throw new Error(
      `Failed to download file: ${
        (isAxiosError(error) && error.response?.data) ||
        (error as Error)?.message ||
        error
      }`,
    );
  }
};

export default downloadStreamedFile;
