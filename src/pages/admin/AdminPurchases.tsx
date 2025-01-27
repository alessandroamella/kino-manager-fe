import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Alert,
  Spinner,
  Spacer,
  Divider,
  Autocomplete,
  AutocompleteItem,
  Tooltip,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiX } from 'react-icons/fi';
import usePurchasesStore from '../../store/purchases';
import useUserStore from '../../store/user';
import { format } from 'date-fns';

interface FormData {
  discount: number;
  autocompleteItem: string;
}

const AdminPurchases = () => {
  const {
    items,
    loadingItems,
    errorItems,
    fetchItems,
    creatingPurchase,
    purchaseError,
    createPurchase,
    resetPurchaseState,
    purchases, // added purchases from store
    loadingPurchases, // added loadingPurchases from store
    errorPurchases, // added errorPurchases from store
    fetchPurchases, // added fetchPurchases from store
  } = usePurchasesStore();
  const { t } = useTranslation();
  const accessToken = useUserStore((store) => store.accessToken);

  const [purchaseItems, setPurchaseItems] = useState<
    { itemId: number; quantity: number }[]
  >([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      discount: 0,
      autocompleteItem: '',
    },
    mode: 'onBlur',
  });

  const autocompleteInputValue = watch('autocompleteItem');

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    fetchItems(accessToken);
    fetchPurchases(accessToken); // fetch purchases on component mount
  }, [accessToken, fetchItems, fetchPurchases]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAddItemToPurchase = useCallback(
    (itemId: number) => {
      const itemExists = purchaseItems.find((item) => item.itemId === itemId);
      if (itemExists) {
        setPurchaseItems(
          purchaseItems.map((item) =>
            item.itemId === itemId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      } else {
        setPurchaseItems([...purchaseItems, { itemId, quantity: 1 }]);
      }
      setSelectedItemKey(null);
      setValue('autocompleteItem', '');
    },
    [purchaseItems, setValue],
  );

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity < 0) return;
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setPurchaseItems(purchaseItems.filter((item) => item.itemId !== itemId));
  };

  const onSubmit = async (data: FormData) => {
    if (!accessToken) {
      alert(t('errors.unauthorized'));
      return;
    } else if (purchaseItems.length === 0) {
      alert(t('purchases.addItemToPurchase'));
      return;
    }

    const purchasePayload = {
      discount: data.discount,
      purchasedItems: purchaseItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      purchaseDate: new Date(),
    };

    const success = await createPurchase(accessToken, purchasePayload);
    if (success) {
      setPurchaseItems([]);
      reset({ discount: 0, autocompleteItem: '' });
      setSuccessMessage(t('purchases.purchaseLoggedSuccessfully'));
      resetPurchaseState();
    }
  };

  const availableItemsForAutocomplete = items.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const handleInputChange = (value: string) => {
    setValue('autocompleteItem', value);
  };

  const getItemById = useCallback(
    (itemId: number) => items.find((item) => item.id === itemId),
    [items],
  );

  return (
    <div className="p-4 md:p-8">
      <Card className="mb-8">
        <CardHeader className="flex justify-between">
          <h2 className="text-lg font-bold">{t('purchases.logPurchase')}</h2>
        </CardHeader>
        <CardBody>
          {successMessage && (
            <Alert color="success" className="mb-4">
              {successMessage}
            </Alert>
          )}
          {purchaseError && (
            <Alert color="danger" className="mb-4">
              {purchaseError}
            </Alert>
          )}

          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">
              {t('purchases.availableItems')}
            </h3>
            <div className="mb-4">
              <Autocomplete
                label={t('purchases.selectItem')}
                placeholder={t('purchases.itemPlaceholder')}
                defaultItems={availableItemsForAutocomplete}
                inputValue={autocompleteInputValue}
                onInputChange={handleInputChange}
                selectedKey={selectedItemKey}
                onSelectionChange={(key) => {
                  if (key) {
                    setSelectedItemKey(key as string);
                    const selectedItemId = availableItemsForAutocomplete.find(
                      (item) => String(item.id) === key,
                    )?.id;
                    if (selectedItemId) {
                      handleAddItemToPurchase(selectedItemId);
                    }
                  } else {
                    setSelectedItemKey(null);
                  }
                }}
                {...register('autocompleteItem')}
              >
                {(item) => (
                  <AutocompleteItem key={String(item.id)}>
                    {item.name}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
          </div>

          <Divider className="my-4" />

          <div>
            <h3 className="text-md font-semibold mb-2">
              {t('purchases.currentPurchase')}
            </h3>
            {purchaseItems.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <Table aria-label="Purchase Items">
                  <TableHeader>
                    <TableColumn>{t('purchases.itemName')}</TableColumn>
                    <TableColumn>{t('purchases.quantity')}</TableColumn>
                    <TableColumn>{t('purchases.actions')}</TableColumn>
                  </TableHeader>
                  <TableBody items={purchaseItems}>
                    {(purchaseItem) => {
                      const itemDetails = items.find(
                        (item) => item.id === purchaseItem.itemId,
                      );
                      return (
                        <TableRow key={purchaseItem.itemId}>
                          <TableCell>{itemDetails?.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              defaultValue={purchaseItem.quantity.toString()}
                              onValueChange={(value) =>
                                handleQuantityChange(
                                  purchaseItem.itemId,
                                  parseInt(value),
                                )
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip content={t('purchases.removeItem')}>
                              <Button
                                isIconOnly
                                variant="light"
                                color="danger"
                                onPress={() =>
                                  handleRemoveItem(purchaseItem.itemId)
                                }
                              >
                                <FiX />
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    }}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p>{t('purchases.noItemsInPurchase')}</p>
            )}
          </div>

          <Spacer y={4} />

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <Input
                label={t('purchases.discount')}
                startContent="%"
                placeholder={t('purchases.discountPlaceholder')}
                type="number"
                className="max-w-xs"
                {...register('discount', {
                  valueAsNumber: true,
                })}
              />
              <Button
                type="submit"
                color="primary"
                isDisabled={creatingPurchase || purchaseItems.length === 0}
              >
                {creatingPurchase ? (
                  <Spinner />
                ) : (
                  <>
                    {t('purchases.logPurchaseButton')}{' '}
                    <FiCheck className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-bold">{t('purchases.purchases')}</h2>
        </CardHeader>
        <CardBody>
          {loadingPurchases ? (
            <div>{t('common.loading')}...</div>
          ) : errorPurchases ? (
            <Alert color="danger" title={t('errors.error')}>
              {errorPurchases}
            </Alert>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table aria-label="Purchases Table">
                <TableHeader>
                  <TableColumn>{t('purchases.id')}</TableColumn>
                  <TableColumn>{t('purchases.discount')}</TableColumn>
                  <TableColumn>{t('purchases.purchaseDate')}</TableColumn>
                  <TableColumn>{t('items.itemsTableTitle')}</TableColumn>
                  <TableColumn>{t('purchases.total')}</TableColumn>
                </TableHeader>
                <TableBody items={purchases}>
                  {(purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.id}</TableCell>
                      <TableCell>{purchase.discount}</TableCell>
                      <TableCell>
                        {format(purchase.purchaseDate, 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {purchase.purchasedItems.map((item) => {
                          const itemDetails = getItemById(item.itemId);
                          return (
                            <div key={item.itemId}>
                              {itemDetails?.name} ({item.quantity})
                            </div>
                          );
                        })}
                      </TableCell>
                      <TableCell>
                        €
                        {purchase.purchasedItems
                          .reduce(
                            (total, item) =>
                              total +
                              (getItemById(item.itemId)?.price || 0) *
                                item.quantity,
                            0,
                          )
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold">{t('items.itemsTableTitle')}</h2>
        </CardHeader>
        <CardBody>
          {loadingItems ? (
            <div>{t('common.loading')}...</div>
          ) : errorItems ? (
            <Alert color="danger" title={t('errors.error')}>
              {errorItems}
            </Alert>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table aria-label="Items Table">
                <TableHeader>
                  <TableColumn>{t('items.id')}</TableColumn>
                  <TableColumn>{t('items.name')}</TableColumn>
                  <TableColumn>{t('items.price')}</TableColumn>
                </TableHeader>
                <TableBody items={items}>
                  {(item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>€{item.price?.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminPurchases;
