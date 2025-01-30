import Price from '@/components/items/Price';
import usePurchasesStore from '@/store/purchases';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Listbox,
  ListboxItem,
  Divider,
  Button,
} from '@heroui/react';
import { formatDate } from 'date-fns';
import { FaPrint } from 'react-icons/fa';

const PurchasesTable = () => {
  const purchases = usePurchasesStore((store) => store.purchases);
  const isLoading = usePurchasesStore((store) => store.loadingData);
  const error = usePurchasesStore((store) => store.errorData);

  const columns = [
    { key: 'purchaseDate', label: 'Purchase Date' },
    { key: 'itemDetails', label: 'Item Details' },
    { key: 'actions', label: 'Actions' },
  ];

  return isLoading ? (
    <div className="flex justify-center items-center h-48">
      <Spinner size="lg" />
    </div>
  ) : error ? (
    <div className="text-red-500">Error: {error}</div>
  ) : !purchases ? (
    <div>No purchases data available.</div>
  ) : (
    <Table isStriped aria-label="Purchases Table">
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={column.key}>{column.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody
        items={purchases}
        loadingContent={<Spinner />}
        isLoading={isLoading}
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => {
              const cellValue = () => {
                switch (columnKey) {
                  case 'purchaseDate':
                    return formatDate(item.purchaseDate, 'dd/MM/yyyy HH:mm:ss');
                  case 'itemDetails':
                    if (item.purchasedItems && item.purchasedItems.length > 0) {
                      return (
                        <>
                          <Listbox
                            aria-label="Purchased Items"
                            items={item.purchasedItems}
                          >
                            {({ item, quantity }) => (
                              <ListboxItem
                                textValue={`${
                                  item.name
                                } x ${quantity} = ${Price.formatPrice(
                                  item.price * quantity,
                                )}`}
                                key={item.id}
                              >
                                <div className="grid grid-cols-2 w-full gap-2">
                                  <div>{item.name}</div>
                                  <div>
                                    {quantity}
                                    <span className="inline-block mx-1">x</span>
                                    <Price price={item.price} />
                                  </div>
                                </div>
                              </ListboxItem>
                            )}
                          </Listbox>
                          <Divider />
                          <Listbox aria-label="Total">
                            <ListboxItem
                              textValue={`Total: ${Price.formatPrice(
                                item.total,
                              )}`}
                            >
                              <div className="grid grid-cols-2 w-full gap-2">
                                <div />
                                <div className="ml-6 flex flex-col">
                                  <p className="text-danger">
                                    {!!item.discount &&
                                      `-${Price.formatPrice(item.discount)}`}
                                  </p>
                                  <p className="text-primary">
                                    <Price price={item.total} />
                                  </p>
                                </div>
                              </div>
                            </ListboxItem>
                          </Listbox>
                        </>
                      );
                    } else {
                      return 'No items';
                    }
                  case 'actions':
                    return (
                      <Button
                        color="primary"
                        isIconOnly
                        onPress={() => {
                          // Do something with the item
                        }}
                      >
                        <FaPrint />
                      </Button>
                    );
                  default:
                    return null;
                }
              };
              return <TableCell>{cellValue()}</TableCell>;
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PurchasesTable;
