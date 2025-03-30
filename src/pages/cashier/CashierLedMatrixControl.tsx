import { getErrorMsg } from '@/types/error';
import { Button, Textarea } from '@heroui/react';
import { useCallback, useRef, useState } from 'react';

const CashierLedMatrixControl = () => {
  const [textToSend, setTextToSend] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // Optional: feedback during connection
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<SerialPort | null>(null);

  // --- Connection Logic (Adapted from CashierSerialDisplay) ---
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    if (!('serial' in navigator)) {
      setError('Web Serial API not supported in this browser.');
      setIsConnecting(false);
      setIsConnected(false);
      return;
    }

    let port: SerialPort | null = null;
    try {
      // Request user to select the serial port for the LED Matrix/Arduino Nano
      port = await navigator.serial.requestPort();
      portRef.current = port;
      console.log('LED Matrix Port selected:', port);
    } catch (err) {
      if ((err as DOMException).name === 'NotFoundError') {
        console.log('User cancelled port selection.');
        // No error state needed here, just didn't connect
      } else {
        console.error('Error requesting port:', err);
        setError(`Error selecting port: ${getErrorMsg(err)}`);
      }
      setIsConnecting(false);
      setIsConnected(false); // Ensure disconnected state
      portRef.current = null; // Clear ref on failure
      return;
    }

    try {
      // Open the port (use a baud rate appropriate for your Arduino Nano sketch)
      await port.open({ baudRate: 9600 }); // Common default, adjust if needed
      console.log('LED Matrix Port opened:', port);
      setIsConnected(true);
      setError(null); // Clear any previous errors on successful connection
    } catch (err) {
      console.error('Error opening port:', err);
      setError(`Error opening port: ${getErrorMsg(err)}`);
      setIsConnected(false);
      portRef.current = null; // Clear ref on failure
    } finally {
      setIsConnecting(false);
    }
  }, []); // No dependencies needed for connect logic itself

  const disconnect = useCallback(async () => {
    setError(null);
    const port = portRef.current;
    if (!port) return;

    try {
      // Note: Readers/Writers must be released before closing.
      // If you add reading capabilities later, ensure locks are released.
      // await reader?.cancel(); // Example if you add a reader
      // await writer?.close(); // Example if you keep a writer open

      await port.close();
      console.log('LED Matrix Port closed.');
    } catch (err) {
      console.error('Error closing port:', err);
      setError(`Error closing port: ${getErrorMsg(err)}`);
      // Still set state even if closing failed partially
    } finally {
      portRef.current = null;
      setIsConnected(false);
      setIsConnecting(false); // Ensure connecting state is reset
    }
  }, []); // No dependencies

  // --- Sending Logic ---
  const sendTextToSerial = useCallback(async () => {
    const port = portRef.current;
    if (!isConnected || !port || !textToSend) {
      console.warn('Cannot send: Not connected, port invalid, or no text.');
      if (!isConnected) setError('Not connected to LED Matrix device.');
      return;
    }
    setError(null); // Clear error on successful attempt start

    const encoder = new TextEncoder();
    let writer: WritableStreamDefaultWriter | null = null;

    try {
      writer = port.writable.getWriter();
      // Send the text followed by a newline, common for Arduino Serial reading
      const dataToSend = textToSend + '\n';
      console.log('Sending to LED Matrix:', dataToSend);
      await writer.write(encoder.encode(dataToSend));
      console.log('Text sent successfully.');
      // Optional: Clear textarea after sending
      // setTextToSend('');
    } catch (err) {
      console.error('Error writing to serial port:', err);
      setError(`Error sending text: ${getErrorMsg(err)}`);
      // Handle potential device disconnection on write error
      if (getErrorMsg(err).includes('disconnected')) {
        disconnect(); // Attempt to clean up state if device disconnected
      }
    } finally {
      // Release the writer lock so other operations can use the port
      if (writer) {
        try {
          await writer.close(); // Close the writer stream after writing
        } catch (closeErr) {
          console.error('Error closing writer:', closeErr);
        }
        // Releasing the lock might not be needed if closing writer does it,
        // but doesn't hurt if called after close. Check Web Serial API docs if needed.
        // writer.releaseLock();
      }
    }
  }, [isConnected, textToSend, disconnect]); // Include disconnect in dependencies

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-center">LED Matrix Control</h2>

      {error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </div>
      )}

      <div className="flex justify-center gap-4">
        {!isConnected ? (
          <Button
            color="primary"
            onPress={connect}
            isDisabled={isConnecting} // Disable while attempting connection
          >
            {isConnecting ? 'Connecting...' : 'Connect to LED Matrix'}
          </Button>
        ) : (
          <Button color="danger" onPress={disconnect}>
            Disconnect from LED Matrix
          </Button>
        )}
      </div>

      {isConnected && (
        <>
          <Textarea
            label="Text to Display"
            placeholder="Enter text to send to the LED matrix..."
            value={textToSend}
            onValueChange={setTextToSend} // Assuming HeroUI uses onValueChange
            // onChange={(e) => setTextToSend(e.target.value)} // Standard HTML way
            minRows={3}
          />
          <Button
            color="secondary"
            onPress={sendTextToSerial}
            isDisabled={!textToSend.trim()} // Disable if textarea is empty or only whitespace
          >
            Send Text
          </Button>
        </>
      )}
    </div>
  );
};

export default CashierLedMatrixControl;
