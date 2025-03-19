import ToggleTheme from '@/components/header/ToggleTheme';
import Price from '@/components/items/Price';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types/PaymentMethod';
import { wait } from '@/utils/wait';
import {
  Alert,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Divider,
  HeroUIProvider,
  Image,
  NumberInput,
  Spinner,
} from '@heroui/react';
import { sumBy } from 'lodash';
import { round } from 'number-precision';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheck,
  FaCreditCard,
  FaMicrochip,
  FaMinus,
  FaMoneyBillWave,
  FaPlus,
} from 'react-icons/fa';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { useShallow } from 'zustand/shallow';
import usePurchasesStore from '../../store/purchases';
import useUserStore from '../../store/user';
import CashierSerialDisplay from './CashierSerialDisplay';
import PurchasesTable from './PurchasesTable';

const CashierRegister = () => {
  const {
    items,
    categories,
    loadingItems,
    errorItems,
    fetchAllData,
    creatingPurchase,
    purchaseError,
    createPurchase,
  } = usePurchasesStore(
    useShallow((store) => ({
      items: store.items,
      categories: store.categories,
      loadingItems: store.loadingItems,
      errorItems: store.errorItems,
      fetchAllData: store.fetchAllData,
      creatingPurchase: store.creatingPurchase,
      purchaseError: store.purchaseError,
      createPurchase: store.createPurchase,
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

  // clear timeout on unmount
  useEffect(() => {
    return () => {
      if (justAddedItemTimeout.current) {
        clearTimeout(justAddedItemTimeout.current);
      }
    };
  }, []);

  const isFetching = useRef(false);
  useEffect(() => {
    if (!accessToken || isFetching.current) return;
    isFetching.current = true;
    fetchAllData(accessToken);
  }, [accessToken, fetchAllData]);

  useEffect(() => {
    if (successMessage) {
      ScrollTop.scrollTop({ elem: selectorRef.current });
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

  const [paymentAndTotal, setPaymentAndTotal] = useState<
    | {
        paymentMethod: PaymentMethod;
        total: number;
      }
    | undefined
  >(undefined);

  const submitPurchase = async (paymentMethod: PaymentMethod) => {
    if (!accessToken) {
      alert(t('errors.unauthorized'));
      return;
    } else if (purchaseItems.length === 0) {
      alert(t('cashier.addItemToPurchase'));
      return;
    }

    setPaymentAndTotal({ paymentMethod, total });

    // since prompt is blocking, wait for serial display to display total
    if (isSerialConnected) {
      await wait(300);
    }

    let givenAmount: number | null = null;
    if (paymentMethod === PaymentMethod.CASH) {
      const val = window.prompt(
        t('cashier.enterAmountGiven', {
          amount: Price.formatPrice(i18n.language, total, 2),
        }),
      );
      givenAmount = parseFloat(val || '');
      if (val === null || Number.isNaN(givenAmount)) {
        console.log('Invalid amount given');
        setPaymentAndTotal(undefined);
        return;
      }
    } else if (paymentMethod === PaymentMethod.CARD) {
      if (!window.confirm(t('cashier.cardAlert'))) {
        return;
      }
    }

    if (givenAmount) {
      if (givenAmount < total) {
        alert(t('cashier.insufficientAmount'));
        setPaymentAndTotal(undefined);
        return;
      } else if (total > 0 && givenAmount !== total) {
        alert(
          t('cashier.change', {
            change: ((givenAmount || 0) - total).toFixed(2),
          }),
        );
      }
    }

    const purchasePayload = {
      discount: parseFloat(discount.toFixed(2)),
      purchasedItems: purchaseItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      purchaseDate: new Date(),
      paymentMethod,
      givenAmount,
    };

    const success = await createPurchase(accessToken, purchasePayload);
    if (success) {
      // so it kind of syncs with the time it takes for the printer to print
      await wait(500);
      setPurchaseItems([]);
      setDiscount(0);
      setSuccessMessage(t('cashier.purchaseLoggedSuccessfully'));
      setCurrentCategory(null);
      setPaymentAndTotal(undefined);
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
    // discount is in euro, not percentage
    return Math.max(
      sumBy(purchaseItems, (item) => {
        const itemDetails = getItemById(item.itemId);
        return itemDetails ? itemDetails.price * item.quantity : 0;
      }) - discount,
      0,
    );
  }, [purchaseItems, getItemById, discount]);

  const itemAndTotal = useMemo(() => {
    if (purchaseItems.length === 0) {
      return undefined;
    }
    const item = items.find((e) => e.id === purchaseItems.at(-1)?.itemId);
    if (!item) {
      console.log('itemAndTotal: item not found');
      return undefined;
    }
    const obj = {
      name: `${item.nameShort || item.name}${
        item.description ? ` ${item.description}` : ''
      }`,
      price: item.price,
      total,
    };
    console.log(
      'itemAndTotal:\n' +
        Object.entries(obj)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
    );
    return obj;
  }, [items, purchaseItems, total]);

  const selectorRef = useRef<HTMLDivElement | null>(null);

  const hasSerial = useMemo(() => {
    return 'serial' in navigator;
  }, []);

  const [isSerialConnected, setIsSerialConnected] = useState(false);

  const serialSectionRef = useRef<HTMLDivElement | null>(null);

  return (
    <HeroUIProvider locale={i18n.language === 'en' ? 'en-gb' : i18n.language}>
      <PageTitle title="cashier" />
      <ScrollTop />
      <header className="bg-background-100 lg:bg-inherit lg:min-h-32 p-4 lg:p-8 flex gap-4 justify-between">
        <div className="max-w-28">
          <Logo />
        </div>
        <div>
          {successMessage && <Alert color="success">{successMessage}ok</Alert>}
          {purchaseError && <Alert color="danger">{purchaseError}</Alert>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            color={isSerialConnected ? 'success' : 'danger'}
            onPress={() =>
              serialSectionRef.current?.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
              })
            }
          >
            <FaMicrochip />
            <span
              className={cn('hidden lg:inline relative', {
                'animate-pulse': !isSerialConnected,
              })}
            >
              {isSerialConnected ? (
                <FaCheck className="text-success" />
              ) : (
                t('cashier.disconnected')
              )}
            </span>
          </Button>
          <ToggleTheme />
        </div>
      </header>
      <main className="p-4 lg:-mt-6 lg:p-8">
        {/* Category and Item Selection */}
        <div className="grid lg:gap-8 grid-cols-1 lg:grid-cols-3 lg:h-[80vh] overflow-y-auto">
          <div className="lg:col-span-2" ref={selectorRef}>
            <div className="mb-8">
              <Breadcrumbs>
                <BreadcrumbItem>
                  <Button
                    variant="bordered"
                    size="lg"
                    onPress={() => setCurrentCategory(null)}
                  >
                    <FiArrowLeft className="text-danger" />
                    {t('cashier.selectCategory')}
                  </Button>
                </BreadcrumbItem>

                {currentCategory && (
                  <BreadcrumbItem>
                    {categories.find((cat) => cat.id === currentCategory)?.name}
                  </BreadcrumbItem>
                )}
              </Breadcrumbs>
            </div>

            {currentCategory === null ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="bordered"
                    color="secondary"
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
                    <span className="text-large leading-none font-medium text-foreground">
                      {category.name}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <>
                {loadingItems ? (
                  <div>{t('common.loading')}...</div>
                ) : errorItems ? (
                  <Alert color="danger" title={t('errors.error')}>
                    {errorItems}
                  </Alert>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
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
                            className="object-contain -mb-1 rounded-md"
                          />
                        )}
                        <span className="text-foreground font-medium leading-none text-wrap text-large">
                          {item.name}
                        </span>
                        {item.description && (
                          <span className="text-foreground-500 -mt-1 mb-1 font-light leading-none text-wrap text-sm">
                            {item.description}
                          </span>
                        )}
                        <span className="text-small -mt-1 text-foreground-600 font-light">
                          <Price price={item.price} />
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

          <Divider className="lg:hidden my-4" />

          {/* Current Purchase Items */}
          <div className="h-full flex flex-col justify-between">
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
                        <p className="line-clamp-1">
                          {itemDetails?.name}
                          {itemDetails?.description && (
                            <span className="text-xs ml-1 text-gray-400">
                              {itemDetails?.description}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            color="warning"
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
                          <p className="w-8 font-bold text-center">
                            {purchaseItem.quantity}
                          </p>
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
                          <span className="w-16 text-small text-center bg-primary px-1 text-black">
                            <span className="font-bold">
                              {purchaseItem.quantity}
                            </span>
                            x
                            <Price
                              price={
                                items.find((e) => e.id === purchaseItem.itemId)
                                  ?.price || 0
                              }
                            />
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="bordered"
                            color="danger"
                            onPress={() =>
                              handleRemoveItem(purchaseItem.itemId)
                            }
                          >
                            <FiX />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>{t('cashier.noItemsInPurchase')}</p>
              )}
            </div>

            <Divider className="lg:hidden my-6" />

            {/* Discount and Submit */}
            <div className="flex flex-col lg:mt-0 gap-2">
              <NumberInput
                label={t('cashier.discount')}
                startContent="-"
                endContent="€"
                placeholder={t('cashier.discountPlaceholder')}
                className="w-full col-span-2"
                value={discount}
                onValueChange={(value) => {
                  setDiscount(value ? round(value, 2) : 0);
                }}
              />
              <div className="grid mb-1 grid-cols-2 lg:grid-cols-3 items-center w-full gap-2">
                {Object.keys(PaymentMethod).map((e, i) => (
                  <Button
                    key={e}
                    color="primary"
                    size="lg"
                    variant={i % 2 === 0 ? 'solid' : 'bordered'}
                    isDisabled={creatingPurchase || purchaseItems.length === 0}
                    onPress={() => submitPurchase(e as PaymentMethod)}
                  >
                    {creatingPurchase ? (
                      <Spinner />
                    ) : (
                      <div className="flex text-black dark:text-inherit gap-2 items-center">
                        {e === PaymentMethod.CASH ? (
                          <FaMoneyBillWave />
                        ) : (
                          <FaCreditCard />
                        )}
                        {t(`paymentMethod.${e}`)}
                      </div>
                    )}
                  </Button>
                ))}
                <p className="col-span-2 lg:col-span-1 text-center lg:text-end font-bold text-xl">
                  <Price price={total} round={false} />
                </p>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-12" />

        <div ref={serialSectionRef}>
          <div className="flex justify-center gap-4">
            {hasSerial ? (
              <CashierSerialDisplay
                itemAndTotal={itemAndTotal}
                paymentAndTotal={paymentAndTotal}
                isConnected={isSerialConnected}
                setIsConnected={setIsSerialConnected}
              />
            ) : (
              <p>{t('cashier.noSerialSupport')}</p>
            )}
          </div>
        </div>

        <Divider className="my-12" />

        <PurchasesTable />
      </main>
    </HeroUIProvider>
  );
};

export default CashierRegister;
