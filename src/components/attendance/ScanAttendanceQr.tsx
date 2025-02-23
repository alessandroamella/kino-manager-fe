import { useState, useCallback } from 'react';
import { OnResultFunction, QrReader } from 'react-qr-reader';
import axios from 'axios';
import { getErrorMsg } from '@/types/error';
import { useTranslation } from 'react-i18next';

const ScanAttendanceQr = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const sendDataToBackend = useCallback(async (qrCodeData: string) => {
    try {
      const { data } = await axios.post('/v1/admin/log-attendance', {
        jwt: qrCodeData,
      });
      console.log('Data sent successfully:', data);
    } catch (error) {
      console.error('Error sending data to backend:', error);
      setScanError(getErrorMsg(error));
      setScanResult(null);
    }
  }, []);

  const handleScan: OnResultFunction = useCallback(
    (result, error) => {
      if (error) {
        console.error('QR Scanner Error:', error);
        setScanError(error.message || 'QR code scan error');
        setScanResult(null);
        return;
      }

      if (result) {
        console.log('QR Code Scanned:', result);
        const text = result.getText();
        setScanResult(text);
        setScanError(null);
        sendDataToBackend(text);
      }
    },
    [sendDataToBackend],
  );

  const handleResetScan = useCallback(() => {
    setScanResult(null);
    setScanError(null);
  }, []);

  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">{t('attendance.title')}</h2>
      <div className="relative max-w-full h-fit">
        {/* Adjust max-width as needed */}
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          videoContainerStyle={{ width: '100%' }}
          videoStyle={{ width: '100%' }}
          containerStyle={{ width: '100%' }}
        />
        {scanError && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            Error scanning QR code: {scanError}
          </div>
        )}
      </div>

      {scanResult ? (
        <div style={{ marginTop: '20px' }}>
          <h3>Scan Result:</h3>
          <p>{scanResult}</p>
          <button onClick={handleResetScan}>Scan Again</button>
        </div>
      ) : (
        <p>Scanning for QR code...</p>
      )}
    </div>
  );
};

export default ScanAttendanceQr;
