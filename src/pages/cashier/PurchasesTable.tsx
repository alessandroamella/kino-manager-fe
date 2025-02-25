import Price from '@/components/items/Price';
import usePurchasesStore from '@/store/purchases';
import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import downloadStreamedFile from '@/utils/download';
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
  Alert,
} from '@heroui/react';
import { formatDate } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPrint } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';

const PurchasesTable = () => {
  const purchases = usePurchasesStore((store) => store.purchases);
  const isLoading = usePurchasesStore((store) => store.loadingData);
  const error = usePurchasesStore((store) => store.errorData);

  const token = useUserStore((store) => store.accessToken);

  const { t } = useTranslation();

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!token) {
      window.alert('Please login to export data');
      return;
    }
    setIsExporting(true);
    try {
      downloadStreamedFile({
        url: 'v1/purchase/export-purchases',
        filename: `acquisti-${formatDate(
          new Date(),
          'dd-MM-yyyy_HH-mm-ss',
        )}.xlsx`,
        token,
      });
    } catch (err) {
      console.error(err);
      window.alert('Error exporting data: ' + getErrorMsg(err));
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'purchaseDate', label: 'Purchase Date' },
    { key: 'itemDetails', label: 'Item Details' },
    { key: 'actions', label: 'Actions' },
  ];

  return isLoading ? (
    <div className="flex justify-center items-center h-48">
      <Spinner size="lg" />
    </div>
  ) : error ? (
    <Alert color="danger" className="mb-4" title={t('errors.error')}>
      {error}
    </Alert>
  ) : !purchases ? (
    <div>No purchases data available.</div>
  ) : (
    <>
      <div className="flex items-center mb-4 flex-row justify-between">
        <h1 className="text-2xl font-bold">{t('cashier.purchasesList')}</h1>
        <Button
          color="primary"
          variant="shadow"
          onPress={handleExportExcel}
          isDisabled={isExporting}
        >
          <FiDownload size={18} className="mr-1" />
          {t('admin.exportToExcel')}
        </Button>
      </div>
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
                    case 'id':
                      return item.id;
                    case 'purchaseDate':
                      return formatDate(
                        item.purchaseDate,
                        'dd/MM/yyyy HH:mm:ss',
                      );
                    case 'itemDetails':
                      if (
                        item.purchasedItems &&
                        item.purchasedItems.length > 0
                      ) {
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
                                      <span className="inline-block mx-1">
                                        x
                                      </span>
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
    </>
  );
};

export default PurchasesTable;
