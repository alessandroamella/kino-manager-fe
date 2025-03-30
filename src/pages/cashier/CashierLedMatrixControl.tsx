import { getErrorMsg } from '@/types/error';
import { Button, Input, Select, SelectItem } from '@heroui/react'; // Assuming HeroUI has Input, Select, Text
import { useCallback, useRef, useState } from 'react';

// Define the structure for an item to be displayed
interface DisplayItem {
  id: string; // Unique ID for list key and removal
  name: string;
  price: number; // Store price as number for easier handling
  symbol: string; // Store symbol code ('0', '1', '2', '3')
}

const SYMBOL_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Heart (♡)' },
  { value: '2', label: 'Pizza (🍕)' },
  { value: '3', label: 'Donut (🍩)' },
];

const CashierLedMatrixControl = () => {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<SerialPort | null>(null);

  // Item Input State
  const [currentItemName, setCurrentItemName] = useState('');
  const [currentItemPrice, setCurrentItemPrice] = useState<number | ''>('');
  const [currentItemSymbol, setCurrentItemSymbol] = useState<string>('0'); // Default to 'None'

  // Staged Items State
  const [itemsToSend, setItemsToSend] = useState<DisplayItem[]>([]);

  // --- Connection Logic (Same as before) ---
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    if (!('serial' in navigator)) {
      setError('Web Serial API not supported.');
      setIsConnecting(false);
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      portRef.current = port;
      await port.open({ baudRate: 9600 });
      setIsConnected(true);
      setError(null);
    } catch (err) {
      if ((err as DOMException).name !== 'NotFoundError') {
        setError(`Error connecting: ${getErrorMsg(err)}`);
      }
      portRef.current = null;
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    const port = portRef.current;
    if (!port) return;
    try {
      // Ensure any readers/writers are closed/cancelled if added later
      await port.close();
    } catch (err) {
      setError(`Error disconnecting: ${getErrorMsg(err)}`);
    } finally {
      portRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // --- Item Handling Logic ---
  const handleAddItem = useCallback(() => {
    // Basic validation
    if (
      !currentItemName.trim() ||
      currentItemPrice === '' ||
      currentItemPrice < 0
    ) {
      setError('Please enter a valid name and a non-negative price.');
      return;
    }
    // Advanced: Check if name contains forbidden characters (:, ?, !) if needed
    if (/[:?!]/.test(currentItemName)) {
      setError(
        "Item name cannot contain ':', '?', or '!'. Use underscore '_' for spaces.",
      );
      return;
    }

    setError(null); // Clear error if validation passes

    const newItem: DisplayItem = {
      id: Date.now().toString(), // Simple unique ID
      name: currentItemName.trim(), // Remove leading/trailing spaces
      price: currentItemPrice,
      symbol: currentItemSymbol,
    };

    setItemsToSend((prevItems) => [...prevItems, newItem]);

    // Reset input fields
    setCurrentItemName('');
    setCurrentItemPrice('');
    setCurrentItemSymbol('0'); // Reset to 'None'
  }, [currentItemName, currentItemPrice, currentItemSymbol]);

  const handleRemoveItem = useCallback((idToRemove: string) => {
    setItemsToSend((prevItems) =>
      prevItems.filter((item) => item.id !== idToRemove),
    );
  }, []);

  // --- Formatting and Sending Logic ---
  const formatItemsForSerial = (items: DisplayItem[]): string => {
    return items
      .map((item) => {
        // Replace spaces with underscores for the Arduino sketch
        const formattedName = item.name.replace(/\s+/g, '_');
        // Format price with comma decimal separator
        const formattedPrice = item.price.toFixed(2).replace('.', ',');
        return `${formattedName}:${formattedPrice}?${item.symbol}`;
      })
      .join('!'); // Join multiple items with '!'
  };

  const sendDataToSerial = useCallback(async () => {
    const port = portRef.current;
    if (!isConnected || !port || itemsToSend.length === 0) {
      if (!isConnected) setError('Not connected to LED Matrix device.');
      if (itemsToSend.length === 0) setError('No items added to send.');
      return;
    }
    setError(null);

    const commandString = formatItemsForSerial(itemsToSend);
    if (!commandString) {
      setError('Failed to format items for sending.');
      return;
    }

    console.log('Formatted Command:', commandString);

    const encoder = new TextEncoder();
    let writer: WritableStreamDefaultWriter | null = null;

    try {
      writer = port.writable.getWriter();
      const dataToSend = commandString + '\n'; // Add newline terminator
      console.log('Sending to LED Matrix:', dataToSend);
      await writer.write(encoder.encode(dataToSend));
      console.log('Data sent successfully.');
      // Optional: Clear the list after sending
      setItemsToSend([]);
    } catch (err) {
      console.error('Error writing to serial port:', err);
      setError(`Error sending data: ${getErrorMsg(err)}`);
      if (getErrorMsg(err).includes('disconnected')) {
        disconnect();
      }
    } finally {
      if (writer) {
        try {
          await writer.close();
        } catch (closeErr) {
          console.error('Error closing writer:', closeErr);
        }
      }
    }
  }, [isConnected, itemsToSend, disconnect]); // Include disconnect

  // Helper to get symbol label for display
  const getSymbolLabel = (symbolValue: string): string => {
    return (
      SYMBOL_OPTIONS.find((opt) => opt.value === symbolValue)?.label ??
      'Unknown'
    );
  };

  // --- Render ---
  return (
    <div className="flex flex-col gap-6 p-4 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center">LED Matrix Control</h2>

      {error && (
        <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-300 rounded-md">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Connect / Disconnect Buttons */}
      <div className="flex justify-center gap-4">
        {!isConnected ? (
          <Button color="primary" onPress={connect} isDisabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect to LED Matrix'}
          </Button>
        ) : (
          <Button color="danger" onPress={disconnect}>
            Disconnect
          </Button>
        )}
      </div>

      {/* Input Form (Only when connected) */}
      {isConnected && (
        <div className="flex flex-col gap-4 p-4 border rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800">
            Add Item to Display
          </h3>
          <Input
            label="Item Name"
            placeholder="e.g., COFFEE or BIG_MAC"
            value={currentItemName}
            onValueChange={setCurrentItemName} // Use onValueChange for HeroUI likely
            // onChange={(e) => setCurrentItemName(e.target.value)} // Standard alternative
          />
          {/* Standard HTML number input - style as needed or use HeroUI equivalent */}
          <div>
            <label
              htmlFor="itemPrice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price (€)
            </label>
            <input
              id="itemPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 1.50"
              value={currentItemPrice}
              onChange={(e) =>
                setCurrentItemPrice(
                  e.target.value === '' ? '' : parseFloat(e.target.value),
                )
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" // Basic styling
            />
          </div>
          <Select
            label="Symbol"
            placeholder="Select a symbol"
            items={SYMBOL_OPTIONS} // Assuming items prop takes this structure
            selectedKeys={currentItemSymbol}
            onSelectionChange={(key) =>
              key.anchorKey && setCurrentItemSymbol(key.anchorKey)
            } // Adjust based on HeroUI Select API
          >
            {/* Render options if Select needs explicit children */}
            {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
          </Select>

          <Button
            color="success" // Or secondary
            onPress={handleAddItem}
            isDisabled={
              !currentItemName.trim() ||
              currentItemPrice === '' ||
              currentItemPrice < 0
            }
          >
            Add Item to List
          </Button>
        </div>
      )}

      {/* Items List (Only when connected and items exist) */}
      {isConnected && itemsToSend.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-gray-800">Items to Send</h3>
          <ul className="border rounded-md divide-y divide-gray-200">
            {itemsToSend.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-3 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <small className="text-gray-600">
                    Price: €{item.price.toFixed(2)} | Symbol:{' '}
                    {getSymbolLabel(item.symbol.toString())}
                  </small>
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="bordered" // Example variant
                  onPress={() => handleRemoveItem(item.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <Button
            color="secondary" // Or primary
            onPress={sendDataToSerial}
            isDisabled={itemsToSend.length === 0}
          >
            Send All Items to LED Matrix
          </Button>
        </div>
      )}
      {/* Message when connected but no items added yet */}
      {isConnected && itemsToSend.length === 0 && (
        <p className="text-center text-gray-500 italic">
          Add items using the form above.
        </p>
      )}
    </div>
  );
};

export default CashierLedMatrixControl;
