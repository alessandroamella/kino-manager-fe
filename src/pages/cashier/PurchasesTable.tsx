import Price from '@/components/items/Price';
import usePurchasesStore from '@/store/purchases';
import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { Item } from '@/types/Item';
import downloadStreamedFile from '@/utils/download';
import {
  Alert,
  Button,
  Divider,
  Listbox,
  ListboxItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { formatDate } from 'date-fns';
import { clamp } from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaPrint } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';

const PurchasesTable = () => {
  const purchases = usePurchasesStore((store) => store.purchases);

  const isLoading = usePurchasesStore((store) => store.loadingPurchases);
  const error = usePurchasesStore((store) => store.errorPurchases);

  const token = useUserStore((store) => store.accessToken);

  const { i18n, t } = useTranslation();

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
    { key: 'id', label: 'items.id' },
    { key: 'purchaseDate', label: 'cashier.purchaseDate' },
    { key: 'itemDetails', label: 'cashier.itemDetails' },
    { key: 'actions', label: 'admin.ctions' },
  ];

  return isLoading ? (
    <div className="flex justify-center items-center h-48">
      <Spinner size="lg" />
    </div>
  ) : error || !purchases ? (
    <Alert
      color="danger"
      className="mb-4"
      title={t('errors.error')}
      icon={<FaExclamationTriangle />}
    >
      {error || t('cashier.noPurchases')}
    </Alert>
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
      <Table
        isVirtualized
        rowHeight={150}
        maxTableHeight={clamp(purchases.length, 1, 4) * 170}
        isStriped
        aria-label={t('cashier.purchasesList')}
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.key}>{t(column.label)}</TableColumn>
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
                              items={
                                item.purchasedItems.filter((e) => e.item) as {
                                  item: Item;
                                  quantity: number;
                                }[]
                              }
                            >
                              {({ item, quantity }) => (
                                <ListboxItem
                                  textValue={`${
                                    item.name
                                  } x ${quantity} = ${Price.formatPrice(
                                    i18n.language,
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
                                  i18n.language,
                                  item.total,
                                )}`}
                              >
                                <div className="grid grid-cols-2 w-full gap-2">
                                  <div />
                                  <div className="ml-6 flex flex-col">
                                    <p className="text-danger">
                                      {!!item.discount && (
                                        <span>
                                          - <Price price={item.discount} />
                                        </span>
                                      )}
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
