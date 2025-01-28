import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Image,
  Input,
  Spacer,
  Alert,
  Spinner,
  Breadcrumbs,
  BreadcrumbItem,
  Divider,
  HeroUIProvider,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import usePurchasesStore from '../../store/purchases';
import useUserStore from '../../store/user';
import { useShallow } from 'zustand/shallow';
import ToggleTheme from '@/components/header/ToggleTheme';
import { FaMinus, FaPlus } from 'react-icons/fa';

const CashierRegister = () => {
  const {
    items,
    categories,
    loadingItems,
    errorItems,
    fetchItems,
    creatingPurchase,
    purchaseError,
    createPurchase,
    resetPurchaseState,
  } = usePurchasesStore(
    useShallow((store) => ({
      items: store.items,
      categories: store.categories,
      loadingItems: store.loadingItems,
      errorItems: store.errorItems,
      fetchItems: store.fetchItems,
      creatingPurchase: store.creatingPurchase,
      purchaseError: store.purchaseError,
      createPurchase: store.createPurchase,
      resetPurchaseState: store.resetPurchaseState,
    })),
  );

  const { i18n, t } = useTranslation();
  const accessToken = useUserStore((store) => store.accessToken);

  const [purchaseItems, setPurchaseItems] = useState<
    { itemId: number; quantity: number }[]
  >([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<number | null>(null);

  const justAddedItemTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [justAddedItem, setJustAddedItem] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    fetchItems(accessToken);
  }, [accessToken, fetchItems]);

  // clear timeout on unmount
  useEffect(() => {
    return () => {
      if (justAddedItemTimeout.current) {
        clearTimeout(justAddedItemTimeout.current);
      }
    };
  }, []);

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
      setJustAddedItem(itemId);
      if (justAddedItemTimeout.current) {
        clearTimeout(justAddedItemTimeout.current);
      }
      justAddedItemTimeout.current = setTimeout(() => {
        setJustAddedItem(null);
      }, 1000);
    },
    [purchaseItems],
  );

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setPurchaseItems(purchaseItems.filter((item) => item.itemId !== itemId));
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      alert(t('errors.unauthorized'));
      return;
    } else if (purchaseItems.length === 0) {
      alert(t('cashier.addItemToPurchase'));
      return;
    }

    const purchasePayload = {
      discount: discount,
      purchasedItems: purchaseItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      purchaseDate: new Date(),
    };

    const success = await createPurchase(accessToken, purchasePayload);
    if (success) {
      setPurchaseItems([]);
      setDiscount(0);
      setSuccessMessage(t('cashier.purchaseLoggedSuccessfully'));
      resetPurchaseState();
      setCurrentCategory(null); // Reset to category view after successful purchase
    }
  };

  const getItemsInCategory = useCallback(
    (categoryId: number | null) => {
      if (!categoryId) {
        return [];
      }
      return items.filter((item) => item.category.id === categoryId);
    },
    [items],
  );

  const currentItems = currentCategory
    ? getItemsInCategory(currentCategory)
    : [];

  const getItemById = useCallback(
    (itemId: number) => items.find((item) => item.id === itemId),
    [items],
  );

  const total = useMemo(() => {
    return purchaseItems.reduce((acc, item) => {
      const itemDetails = getItemById(item.itemId);
      if (!itemDetails) {
        return acc;
      }
      return acc + itemDetails.price * item.quantity;
    }, 0);
  }, [purchaseItems, getItemById]);

  return (
    <HeroUIProvider locale={i18n.language === 'en' ? 'en-gb' : i18n.language}>
      <main className="p-4 md:p-8">
        <Card className="max-w-screen-lg mx-auto md:p-2">
          <CardHeader className="flex justify-between">
            <h2 className="text-lg font-bold">{t('cashier.logPurchase')}</h2>
            <ToggleTheme />
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

            {/* Category and Item Selection */}
            <div className="mb-6">
              {currentCategory === null ? (
                <>
                  <h3 className="text-md font-semibold mb-2">
                    {t('cashier.selectCategory')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant="bordered"
                        className="h-auto p-2 flex flex-col items-center justify-center min-w-28 min-h-28"
                        onPress={() => setCurrentCategory(category.id)}
                      >
                        {category.imageUrl && (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            width={60}
                            height={60}
                            className="object-contain mb-2 rounded-md"
                          />
                        )}
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <Breadcrumbs>
                      <BreadcrumbItem>
                        <Button
                          variant="bordered"
                          isIconOnly
                          size="lg"
                          color="danger"
                          onPress={() => setCurrentCategory(null)}
                        >
                          <FiArrowLeft />
                        </Button>
                      </BreadcrumbItem>
                      <BreadcrumbItem>
                        {
                          categories.find((cat) => cat.id === currentCategory)
                            ?.name
                        }
                      </BreadcrumbItem>
                    </Breadcrumbs>
                  </div>
                  <h3 className="text-md font-semibold mb-2">
                    {t('cashier.selectItem')} -{' '}
                    {categories.find((cat) => cat.id === currentCategory)?.name}
                  </h3>
                  {loadingItems ? (
                    <div>{t('common.loading')}...</div>
                  ) : errorItems ? (
                    <Alert color="danger" title={t('errors.error')}>
                      {errorItems}
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {currentItems.map((item) => (
                        <Button
                          key={item.id}
                          variant="bordered"
                          color={
                            justAddedItem === item.id ? 'success' : 'primary'
                          }
                          className="h-auto p-2 flex flex-col items-center justify-center min-w-28 min-h-28"
                          onPress={() => handleAddItemToPurchase(item.id)}
                        >
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={60}
                              height={60}
                              className="object-contain mb-2 rounded-md"
                            />
                          )}
                          <span className="text-foreground text-medium">
                            {item.name}
                          </span>
                          <span className="text-small -mt-2 text-foreground-400">
                            €
                            {Number.isInteger(item.price)
                              ? item.price
                              : item.price.toFixed(2)}
                          </span>
                        </Button>
                      ))}
                      {currentItems.length === 0 && (
                        <div>No items in this category.</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <Divider className="my-4" />

            {/* Current Purchase Items */}
            <div>
              <h3 className="text-md font-semibold mb-2">
                {t('cashier.currentPurchase')}
              </h3>
              {purchaseItems.length > 0 ? (
                <div className="space-y-2">
                  {purchaseItems.map((purchaseItem) => {
                    const itemDetails = getItemById(purchaseItem.itemId);
                    return (
                      <div
                        key={purchaseItem.itemId}
                        className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-800"
                      >
                        <div>{itemDetails?.name}</div>
                        <div className="flex items-center space-x-2">
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="bordered"
                            onPress={() =>
                              handleQuantityChange(
                                purchaseItem.itemId,
                                purchaseItem.quantity - 1,
                              )
                            }
                          >
                            <FaMinus />
                          </Button>
                          <Input
                            type="number"
                            size="sm"
                            className="w-16 text-center"
                            value={purchaseItem.quantity.toString()}
                            onValueChange={(value) =>
                              handleQuantityChange(
                                purchaseItem.itemId,
                                parseInt(value) || 0,
                              )
                            }
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="warning"
                            variant="bordered"
                            onPress={() =>
                              handleQuantityChange(
                                purchaseItem.itemId,
                                purchaseItem.quantity + 1,
                              )
                            }
                          >
                            <FaPlus />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() =>
                              handleRemoveItem(purchaseItem.itemId)
                            }
                          >
                            <FiX />
                          </Button>
                          <span className="ml-2">
                            {purchaseItem.quantity} x €
                            {items
                              .find((e) => e.id === purchaseItem.itemId)
                              ?.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>{t('cashier.noItemsInPurchase')}</p>
              )}
            </div>

            <Spacer y={4} />

            {/* Discount and Submit */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-y-4 mt-2 md:space-y-0 md:space-x-4">
              <Input
                label={t('cashier.discount')}
                startContent="%"
                placeholder={t('cashier.discountPlaceholder')}
                type="number"
                className="max-w-xs"
                value={discount.toString()}
                onValueChange={(e) => setDiscount(parseInt(e) || 0)}
              />
              <Button
                color="primary"
                isDisabled={creatingPurchase || purchaseItems.length === 0}
                onPress={handleSubmit}
              >
                {creatingPurchase ? (
                  <Spinner />
                ) : (
                  <>
                    {t('cashier.logPurchaseButton')}{' '}
                    <FiCheck className="ml-2" />
                  </>
                )}
              </Button>
              <p className="font-bold text-xl md:justify-self-end">
                €{total.toFixed(2)}
              </p>
            </div>
          </CardBody>
        </Card>
      </main>
    </HeroUIProvider>
  );
};

export default CashierRegister;
