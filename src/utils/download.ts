import axios, { isAxiosError } from 'axios';

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

    const blob = new Blob([response.data]); // Create Blob from response data

    // Create file link in browser's memory
    const href = URL.createObjectURL(blob);

    // Create "a" HTML element with href to file & click
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', filename); // Use provided filename
    document.body.appendChild(link);
    link.click();

    // Clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);

    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    if (onComplete) {
      onComplete(); // Still call onComplete to signal end, even with error
    }
    throw new Error(
      `Failed to download file: ${
        (isAxiosError(error) && error.response?.data) ||
        (error as Error)?.message ||
        error
      }`,
    ); // Re-throw for caller to handle
  }
};

export default downloadStreamedFile;
