import { PaymentMethod } from '@/types/PaymentMethod';
import { toFixedItalian } from '@/utils/toFixedItalian';
import { Button } from '@heroui/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  async function connectToESP32() {
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
          ? t(`paymentMethod.${paymentAndTotal?.paymentMethod}`, {
              lng: 'it',
            }) +
            '|' +
            toFixedItalian(paymentAndTotal!.total)
          : itemAndTotal
          ? unidecode(itemAndTotal.name) +
            '|' +
            toFixedItalian(itemAndTotal.price) +
            '|' +
            toFixedItalian(itemAndTotal.total)
          : // impossible case
            (console.log('sa ghé????'), null)) + '\n';

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

  return (
    <div className="flex justify-center">
      {isConnected ? (
        <Button color="danger" onPress={disconnect}>
          Disconnect from ESP32
        </Button>
      ) : (
        <Button color="primary" onPress={connectToESP32}>
          Connect to ESP32
        </Button>
      )}
    </div>
  );
};

export default CashierSerialDisplay;
