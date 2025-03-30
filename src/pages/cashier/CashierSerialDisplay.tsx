import { cn } from '@/lib/utils';
import { getErrorMsg } from '@/types/error';
import { PaymentMethod } from '@/types/PaymentMethod';
import { toFixedItalian } from '@/utils/toFixedItalian';
import { wait } from '@/utils/wait';
import { Button, Switch, Textarea } from '@heroui/react';
import { formatDate } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiAlarmWarningFill } from 'react-icons/ri';
import unidecode from 'unidecode';

const CashierSerialDisplay = ({
  itemAndTotal,
  paymentAndTotal,
  isConnected,
  setIsConnected,
}: {
  itemAndTotal?: { name: string; price: number; total: number };
  paymentAndTotal?: { paymentMethod: PaymentMethod; total: number };
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
}) => {
  const { t } = useTranslation();

  const portRef = useRef<SerialPort | null>(null);
  async function connect() {
    // check if the browser supports Web Serial
    if (!('serial' in navigator)) {
      window.alert("Web Serial API not supported, can't connect to ESP32");
      setIsConnected(false);
      return;
    }

    let port;
    try {
      port = await navigator.serial.requestPort(); // Ask user to select the device
      portRef.current = port;
      console.log('Port selected:', port);

      printLogs();
      // print logs
    } catch (err) {
      if ((err as DOMException).name === 'NotFoundError') {
        console.log('User canceled the request');
        return;
      }
      console.error('Error in requestPort:', err);
      setIsConnected(false);
      return;
    }

    try {
      await port.open({ baudRate: 9600 });
      console.log('Port opened:', port);
      setIsConnected(true);
    } catch (error) {
      console.error('Error in port.open:', error);
      setIsConnected(false);
    }
  }

  const [logs, setLogs] = useState<string[]>([]);

  const printLogs = useCallback(async () => {
    const port = portRef.current;
    if (!port) {
      console.log('printLogs: port is null');
      return;
    }

    while (portRef.current && isConnected) {
      const reader = portRef.current.readable.getReader();
      // For decoding Uint8Array to string
      const textDecoder = new TextDecoder();

      // Check if component is still mounted
      try {
        const { value, done } = await reader.read();

        if (done) {
          console.log('Reader done, exiting loop.');
          reader.releaseLock();
          break;
        }

        if (value) {
          const decodedString = textDecoder.decode(value);
          setLogs((logs) => [
            ...logs,
            formatDate(new Date(), 'HH:mm - ') + decodedString,
          ]);
          console.log('Received data:', decodedString);
        }

        await wait(50); // Optional: Add a small delay to prevent overloading - adjust as needed
      } catch (error) {
        if (port) {
          // Only set error if component is still mounted
          console.error(
            `Error reading from serial port: ${getErrorMsg(error)}`,
          );
        }
        console.error('Error during read:', error);
        setLogs((logs) => [
          ...logs,
          formatDate(new Date(), 'HH:mm - ') + getErrorMsg(error),
        ]);
        break; // Exit the loop on read error
      }
    }
  }, [isConnected]);

  useEffect(() => {
    async function sendItem() {
      const port = portRef.current;
      if (!isConnected || !port || (!itemAndTotal && !paymentAndTotal)) {
        console.log('Not connected to ESP32 or no item to send:', {
          isConnected,
          port,
          itemAndTotal,
        });
        return;
      }

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();

      // Send data to ESP32
      // force Italian locale
      const str =
        (paymentAndTotal
          ? t(`paymentMethod.${paymentAndTotal.paymentMethod}`, {
              lng: 'it',
            }) +
            '|' +
            toFixedItalian(paymentAndTotal.total)
          : itemAndTotal
          ? unidecode(itemAndTotal.name) +
            '|' +
            toFixedItalian(itemAndTotal.price) +
            '|' +
            toFixedItalian(itemAndTotal.total)
          : // impossible case
            (console.log('sa ghé???? paymentAndTotal:', paymentAndTotal),
            null)) + '\n';

      console.log(
        'Sending item to ESP32:',
        itemAndTotal || paymentAndTotal,
        '\n' + str,
      );

      await writer.write(encoder.encode(str));
      writer.releaseLock();
    }

    sendItem();
  }, [itemAndTotal, isConnected, paymentAndTotal, t]);

  async function disconnect() {
    const port = portRef.current;
    if (!port) return;
    await port.close();
    setIsConnected(false);
  }

  const [strobeOn, _setStrobeOn] = useState(false);

  function setStrobeOn(strobeOn: boolean) {
    _setStrobeOn(strobeOn);
    const port = portRef.current;
    if (!port) return;
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    writer.write(encoder.encode(strobeOn ? 'strobeOn\n' : 'strobeOff\n'));
    writer.releaseLock();
    console.log('Sent strobe alarm:', strobeOn);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-4">
        {isConnected ? (
          <>
            <Button color="danger" onPress={disconnect}>
              Disconnect from ESP32
            </Button>
            <Switch
              className={cn('px-2 transition-colors py-1 rounded-xl', {
                'border animate-border-loop': strobeOn,
                'bg-primary': !strobeOn,
              })}
              thumbIcon={<RiAlarmWarningFill />}
              isSelected={strobeOn}
              onValueChange={setStrobeOn}
            >
              <span
                className={cn('text-small', {
                  'dark:text-black': !strobeOn,
                })}
              >
                Strobe alarm
              </span>
            </Switch>
          </>
        ) : (
          <Button color="primary" onPress={connect}>
            Connect to ESP32
          </Button>
        )}
      </div>
      <Textarea isReadOnly placeholder="Logs" value={logs.join('\n')} />
    </div>
  );
};

export default CashierSerialDisplay;
