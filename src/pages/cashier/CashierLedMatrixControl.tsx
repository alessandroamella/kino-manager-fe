// src/components/CashierLedMatrixControl.tsx
import { cn } from '@/lib/utils';
import { getErrorMsg } from '@/types/error';
import { Button, Select, Selection, SelectItem, Textarea } from '@heroui/react';
import { formatDate } from 'date-fns';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import unidecode from 'unidecode';

// Define the allowed characters based on the Arduino code's 'carattere' array
// Arduino: ' ', ',', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', 'W', 'J', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
// Note: We'll handle space separately (convert to '_')
const ALLOWED_CHARS = new Set(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,'.split(''),
);
// Also allow underscore as it's our replacement for space
ALLOWED_CHARS.add('_');

// Symbol definitions matching the Arduino code
const SYMBOLS = [
  { key: '0', label: 'None', value: 0 },
  { key: '1', label: 'Heart ❤️', value: 1 },
  { key: '2', label: 'Pizza 🍕', value: 2 },
  { key: '3', label: 'Donut 🍩', value: 3 },
];

const CashierLedMatrixControl: React.FC = () => {
  const { t } = useTranslation();
  const portRef = useRef<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  // const [selectedSymbolKey, setSelectedSymbolKey] = useState<React.Key>('0'); // Store the key ('0', '1', '2', '3')
  const [selectedSymbolKey, setSelectedSymbolKey] = useState<Selection>(
    new Set(['0']),
  ); // Store the key ('0', '1', '2', '3')

  // ----- Connection Logic (adapted from your example) -----
  async function connect() {
    if (!('serial' in navigator)) {
      window.alert(t('serial.webSerialNotSupported'));
      setIsConnected(false);
      return;
    }

    let port: SerialPort;
    try {
      port = await navigator.serial.requestPort();
      portRef.current = port;
      console.log('Port selected:', port);
      printLogs(); // Start listening for logs
    } catch (err) {
      if ((err as DOMException).name === 'NotFoundError') {
        console.log('User canceled the request');
        return;
      }
      console.error('Error in requestPort:', err);
      logError(t('serial.errorRequestPort', { error: getErrorMsg(err) }));
      setIsConnected(false);
      return;
    }

    try {
      await port.open({ baudRate: 9600 }); // Match Arduino's baud rate
      console.log('Port opened:', port);
      setIsConnected(true);
      logInfo(t('serial.connected'));
    } catch (error) {
      console.error('Error in port.open:', error);
      logError(t('serial.errorOpenPort', { error: getErrorMsg(error) }));
      setIsConnected(false);
      portRef.current = null; // Clear ref if open failed
    }
  }

  async function disconnect() {
    const port = portRef.current;
    if (!port || !port.readable) {
      // Port might already be closed or inaccessible
      setIsConnected(false);
      portRef.current = null;
      logInfo(t('serial.alreadyDisconnected'));
      return;
    }

    // Attempt to close the port gracefully
    try {
      // Cancel any pending reads - Important!
      if (port.readable) {
        const reader = port.readable.getReader();
        try {
          await reader.cancel(); // Request cancellation
          reader.releaseLock(); // Release the lock
        } catch (cancelError) {
          console.warn('Error cancelling reader:', cancelError);
          // Log warning but continue disconnection attempt
          logWarn(
            t('serial.errorCancellingReader', {
              error: getErrorMsg(cancelError),
            }),
          );
        }
      }

      // Close the writable stream if it exists and isn't locked
      if (port.writable && !port.writable.locked) {
        try {
          await port.writable.close();
        } catch (writeCloseError) {
          console.warn('Error closing writable stream:', writeCloseError);
          logWarn(
            t('serial.errorClosingWritable', {
              error: getErrorMsg(writeCloseError),
            }),
          );
        }
      } else if (port.writable && port.writable.locked) {
        logWarn(t('serial.writableLocked'));
        // Attempt to abort the writer if locked - might be necessary
        try {
          await port.writable.abort();
        } catch (abortError) {
          console.error('Error aborting writer:', abortError);
          logError(
            t('serial.errorAbortingWriter', { error: getErrorMsg(abortError) }),
          );
        }
      }

      // Now close the port itself
      await port.close();
      console.log('Port closed');
      logInfo(t('serial.disconnected'));
    } catch (error) {
      console.error('Error during disconnect:', error);
      logError(t('serial.errorDisconnecting', { error: getErrorMsg(error) }));
      // Even if closing fails, update state to reflect intended disconnection
    } finally {
      // Ensure state is updated regardless of errors
      setIsConnected(false);
      portRef.current = null;
    }
  }

  // ----- Logging Logic -----
  const log = useCallback((level: string, message: string) => {
    const timestamp = formatDate(new Date(), 'HH:mm:ss');
    setLogs((prevLogs) => [...prevLogs, `${timestamp} [${level}] ${message}`]);
    if (level === 'ERROR') console.error(message);
    else if (level === 'WARN') console.warn(message);
    else console.log(message);
  }, []);

  const logInfo = useCallback((message: string) => log('INFO', message), [log]);
  const logError = useCallback(
    (message: string) => log('ERROR', message),
    [log],
  );
  const logWarn = useCallback((message: string) => log('WARN', message), [log]);

  const printLogs = useCallback(async () => {
    const port = portRef.current;
    // Ensure port exists and is readable before proceeding
    if (!port?.readable) {
      logWarn('printLogs: Port is not available or readable.');
      return;
    }

    // Use a flag to control the loop based on connection status
    let keepReading = true;
    const textDecoder = new TextDecoder();

    // Add event listener for disconnect
    // Note: The 'disconnect' event might not be reliably fired depending on the browser and circumstances.
    const handleDisconnect = () => {
      console.log('Serial disconnect event detected.');
      logWarn(t('serial.disconnectEventDetected'));
      keepReading = false; // Signal the loop to stop
      setIsConnected(false); // Update connection state
      portRef.current = null; // Clear the port reference
      // Remove the listener itself
      navigator.serial.removeEventListener('disconnect', handleDisconnect);
    };
    navigator.serial.addEventListener('disconnect', handleDisconnect, {
      once: true,
    });

    while (portRef.current && isConnected && keepReading && port.readable) {
      const reader = port.readable.getReader();
      try {
        while (keepReading) {
          // Inner loop controlled by the flag
          const { value, done } = await reader.read();

          if (done) {
            logInfo('Reader stream closed.');
            reader.releaseLock();
            keepReading = false; // Exit outer loop as well
            break; // Exit inner loop
          }

          if (value) {
            const decodedString = textDecoder.decode(value, { stream: true });
            logInfo(`Received: ${decodedString.replace(/(\r\n|\n|\r)/gm, '')}`); // Clean up newlines for cleaner log
          }
        }
      } catch (error) {
        logError(t('serial.errorReading', { error: getErrorMsg(error) }));
        keepReading = false; // Stop reading on error
        // Don't automatically disconnect here, let the disconnect function handle cleanup
      } finally {
        // Ensure the reader lock is always released if the loop terminates unexpectedly
        if (port.readable && reader) {
          // Check if port is still readable before releasing
          try {
            reader.releaseLock();
          } catch (releaseLockError) {
            // It's possible the port closed causing the read error,
            // making releaseLock also throw. Ignore this specific error.
            console.warn(
              'Could not release reader lock, port might be closed:',
              releaseLockError,
            );
          }
        }
      }
    }
    // Clean up listener if the loop finishes for reasons other than the disconnect event
    navigator.serial.removeEventListener('disconnect', handleDisconnect);
    logInfo('Stopped listening for serial data.');
  }, [isConnected, logError, logInfo, logWarn, t]);

  // Effect to start/stop listening when connection status changes
  useEffect(() => {
    if (isConnected && portRef.current) {
      printLogs();
    }
    // Cleanup function will be implicitly handled by the disconnect logic
    // and the loop condition in printLogs checking `isConnected`
  }, [isConnected, printLogs]);

  // ----- Message Sending Logic -----
  const sanitizeMessage = (input: string): string => {
    // 1. Decode unicode/accented characters to basic ASCII
    const decoded = unidecode(input);
    // 2. Convert to uppercase
    const upper = decoded.toUpperCase();
    // 3. Filter characters and replace space with underscore
    let sanitized = '';
    for (const char of upper) {
      if (char === ' ') {
        sanitized += '_';
      } else if (ALLOWED_CHARS.has(char)) {
        sanitized += char;
      } else {
        logWarn(`Character '${char}' skipped (not allowed).`);
      }
    }
    return sanitized;
  };

  const handleSendMessage = async () => {
    const port = portRef.current;
    if (!isConnected || !port?.writable) {
      logError(t('serial.notConnectedOrWritable'));
      return;
    }

    const sanitizedText = sanitizeMessage(messageText);
    if (!sanitizedText) {
      logWarn('Message is empty after sanitization, not sending.');
      return;
    }

    const symbolCode =
      SYMBOLS.find((s) => s.key === selectedSymbolKey)?.value ?? 0;

    // Format according to Arduino protocol: Text:Price?SymbolCode\n
    // Using '0' as placeholder price
    const command = `${sanitizedText}:0?${symbolCode}\n`;

    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();

    try {
      logInfo(`Sending: ${command.replace('\n', '\\n')}`); // Log clearly
      await writer.write(encoder.encode(command));
      logInfo(t('serial.messageSent'));
    } catch (error) {
      logError(t('serial.errorSending', { error: getErrorMsg(error) }));
    } finally {
      // Ensure the lock is released after writing
      if (writer) {
        try {
          await writer.close(); // prefer close over releaseLock after writing is done
        } catch (closeError) {
          console.warn('Error closing writer:', closeError);
          // If close fails, try releasing lock as fallback
          try {
            writer.releaseLock();
          } catch (releaseError) {
            console.error('Failed to release writer lock:', releaseError);
          }
        }
      }
    }
  };

  // ----- Render Component -----
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-center">
        {t('ledMatrix.controlPanelTitle', 'LED Matrix Control')}
      </h2>

      {/* Connection Controls */}
      <div className="flex justify-center gap-4">
        {isConnected ? (
          <Button color="danger" onPress={disconnect}>
            {t('serial.disconnect', 'Disconnect')}
          </Button>
        ) : (
          <Button color="primary" onPress={connect}>
            {t('serial.connect', 'Connect to Display')}
          </Button>
        )}
      </div>
      <p className="text-center text-sm">
        {t('serial.status', 'Status:')}{' '}
        <span
          className={cn('font-bold', {
            'text-success': isConnected,
            'text-danger': !isConnected,
          })}
        >
          {isConnected ? t('serial.connected') : t('serial.disconnected')}
        </span>
      </p>

      {/* Message Input and Controls */}
      {isConnected && (
        <div className="flex flex-col gap-3 mt-4">
          <Textarea
            label={t('ledMatrix.messageLabel', 'Message to Display')}
            placeholder={t(
              'ledMatrix.messagePlaceholder',
              'Enter text here... (A-Z, 0-9, Comma)',
            )}
            value={messageText}
            onValueChange={setMessageText} // HeroUI uses onValueChange
            maxLength={100} // Add a reasonable max length
            description={t(
              'ledMatrix.messageDescription',
              'Spaces become underscores (_). Unsupported characters are removed.',
            )}
          />

          <Select
            label={t('ledMatrix.iconLabel', 'Select Icon')}
            items={SYMBOLS}
            selectedKeys={selectedSymbolKey}
            onSelectionChange={(key) => setSelectedSymbolKey(key)}
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>

          <Button color="success" onPress={handleSendMessage} className="mt-2">
            {t('ledMatrix.sendButton', 'Send to Display')}
          </Button>
        </div>
      )}

      {/* Logs */}
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-1">
          {t('serial.logsTitle', 'Logs')}
        </h3>
        <Textarea
          isReadOnly
          value={logs.join('\n')}
          className="h-40 font-mono text-xs bg-gray-100 dark:bg-gray-800" // Adjusted styling for logs
          aria-label={t('serial.logsTitle', 'Logs')} // Accessibility
        />
      </div>
    </div>
  );
};

export default CashierLedMatrixControl;
