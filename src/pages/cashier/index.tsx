import ChangeLanguage from '@/components/header/ChangeLanguage';
import ToggleTheme from '@/components/header/ToggleTheme';
import Price from '@/components/items/Price';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import Logo from '@/components/ui/Logo';
import useIsTailwindLg from '@/hooks/useIsTailwindLg';
import { cn } from '@/lib/utils';
import { ItemWithCategory } from '@/types/Item';
import { PaymentMethod } from '@/types/PaymentMethod';
import { wait } from '@/utils/wait';
import {
  addToast,
  Alert,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Divider,
  Image,
  Input,
  NumberInput,
  Spinner,
  Tooltip,
} from '@heroui/react';
import Fuse from 'fuse.js';
import { clamp, sumBy } from 'lodash';
import { round } from 'number-precision';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMacOs, isMobile, isWindows } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { BiSearch, BiSolidKeyboard } from 'react-icons/bi';
import {
  FaCheck,
  FaCreditCard,
  FaMicrochip,
  FaMinus,
  FaMoneyBillWave,
  FaPlus,
} from 'react-icons/fa';
import { FiArrowLeft, FiArrowRight, FiHome, FiX } from 'react-icons/fi';
import { TbDeviceDesktopOff } from 'react-icons/tb';
import { useShallow } from 'zustand/shallow';
import usePurchasesStore from '../../store/purchases';
import useUserStore from '../../store/user';
import CashierSerialDisplay from './CashierSerialDisplay';
import CashierShortcutsInfo from './CashierShortcutsInfo';
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

  const fuse = useRef(
    new Fuse<ItemWithCategory>(items, {
      ignoreDiacritics: true,
      minMatchCharLength: 1,
      threshold: 0.4,
      keys: ['name', 'description', 'category.name'],
    }),
  );

  // update fuse collection when items change
  useEffect(() => {
    fuse.current.setCollection(items);
  }, [items]);

  const { i18n, t } = useTranslation();
  const accessToken = useUserStore((store) => store.accessToken);

  const [purchaseItems, setPurchaseItems] = useState<
    { itemId: number; quantity: number }[]
  >([]);
  // const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = useMemo(() => searchQuery.length > 0, [searchQuery]);

  useEffect(() => {
    if (isSearching && currentCategory !== null) {
      setCurrentCategory(null);
    }
  }, [currentCategory, isSearching]);

  const isFetching = useRef(false);
  useEffect(() => {
    if (!accessToken || isFetching.current) return;
    isFetching.current = true;
    fetchAllData(accessToken);
  }, [accessToken, fetchAllData]);

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

  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
      addToast({
        title: t('common.success'),
        description: t('cashier.purchaseLoggedSuccessfully'),
        color: 'success',
      });
      setCurrentCategory(null);
      setPaymentAndTotal(undefined);
      searchInputRef.current?.focus();
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

  const getItemsBySearch = useCallback(
    (query: string) => {
      if (!query) {
        return [];
      }
      const results = fuse.current.search(query);
      return results.map((result) => result.item);
    },
    [fuse],
  );

  const currentItems = useMemo(() => {
    return isSearching
      ? getItemsBySearch(searchQuery)
      : currentCategory
      ? getItemsInCategory(currentCategory)
      : [];
  }, [
    currentCategory,
    getItemsBySearch,
    getItemsInCategory,
    isSearching,
    searchQuery,
  ]);

  const isTwLarge = useIsTailwindLg();

  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);

  const searchSelectedItem = useMemo(() => {
    return currentItems[clamp(searchSelectedIndex, 0, currentItems.length - 1)];
  }, [currentItems, searchSelectedIndex]);

  const handleInputPress = useCallback(
    (e: React.KeyboardEvent) => {
      setSearchSelectedIndex((prev) => {
        const add = (n: number) => {
          e.preventDefault();
          return clamp(prev + n, 0, currentItems.length - 1);
        };
        console.log('Key pressed:', e.key, 'Prev:', prev);
        if (e.key === 'ArrowRight') {
          return add(1);
        } else if (e.key === 'ArrowLeft') {
          return add(-1);
        } else if (e.key === 'ArrowDown') {
          return add(isTwLarge ? 5 : 2);
        } else if (e.key === 'ArrowUp') {
          return add(-(isTwLarge ? 5 : 2));
        } else if (e.key === 'Enter') {
          if (searchSelectedItem) {
            handleAddItemToPurchase(searchSelectedItem.id);
          }
          return prev;
        }
        return 0;
      });
    },
    [
      currentItems.length,
      handleAddItemToPurchase,
      isTwLarge,
      searchSelectedItem,
    ],
  );

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

  const [shortcutsInfoOpen, setShortcutsInfoOpen] = useState(false);
  const openShortcutsInfo = () => setShortcutsInfoOpen(true);

  return (
    <>
      <PageTitle title="cashier" />
      <ScrollTop />
      <CashierShortcutsInfo
        isOpen={shortcutsInfoOpen}
        onOpenChange={setShortcutsInfoOpen}
      />
      <header className="bg-background-100 lg:bg-inherit lg:min-h-32 p-4 lg:p-8 flex gap-4 justify-between">
        <div className="max-w-28">
          <Logo />
        </div>
        <div>
          {purchaseError && (
            <Alert title={t('common.error')} color="danger">
              {purchaseError}
            </Alert>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <ChangeLanguage />
          {hasSerial && (
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
          )}
          <ToggleTheme />
        </div>
      </header>

      {(isWindows || isMacOs || isMobile) && (
        <div className="m-4">
          <Alert
            icon={<TbDeviceDesktopOff />}
            color="warning"
            title={t('cashier.notSupported')}
          >
            {t('cashier.notSupportedInfo')}
          </Alert>
        </div>
      )}
      <main className="p-8 lg:-mt-6 lg:p-8">
        {/* Category and Item Selection */}
        <div className="grid lg:gap-8 grid-cols-1 lg:grid-cols-3 lg:h-[80vh] overflow-y-auto">
          <div className="lg:col-span-2" ref={selectorRef}>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <Breadcrumbs>
                  <BreadcrumbItem>
                    <Button
                      variant="bordered"
                      size="lg"
                      isDisabled={currentCategory === null}
                      onPress={() => setCurrentCategory(null)}
                    >
                      {currentCategory ? (
                        <FiArrowLeft className="text-danger" />
                      ) : (
                        <FiHome />
                      )}
                      {t('cashier.selectCategory')}
                    </Button>
                  </BreadcrumbItem>

                  {currentCategory && (
                    <BreadcrumbItem>
                      {
                        categories.find((cat) => cat.id === currentCategory)
                          ?.name
                      }
                    </BreadcrumbItem>
                  )}
                </Breadcrumbs>

                <Tooltip content={t('cashier.shortcutsInfo')}>
                  <Button isIconOnly onPress={openShortcutsInfo}>
                    <BiSolidKeyboard />
                  </Button>
                </Tooltip>
              </div>
            </div>

            <div className="mb-4 px-1">
              <Input
                onKeyDown={handleInputPress}
                autoFocus
                ref={searchInputRef}
                placeholder={t('cashier.searchItem')}
                startContent={
                  <BiSearch className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                }
                type="search"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>

            {!isSearching && currentCategory === null ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="bordered"
                    color="secondary"
                    tabIndex={-1}
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
                  <div
                    tabIndex={-1}
                    onKeyDown={handleInputPress}
                    className="max-h-72 outline-none overflow-y-auto grid grid-cols-2 lg:grid-cols-5 gap-2"
                  >
                    {currentItems.map((item) => (
                      <Button
                        key={item.id}
                        variant="bordered"
                        tabIndex={-1}
                        color={
                          (
                            justAddedItem
                              ? justAddedItem === item.id
                              : searchSelectedItem?.id === item.id
                          )
                            ? 'success'
                            : 'primary'
                        }
                        className={cn(
                          'h-auto outline-none p-2 flex flex-col items-center justify-center min-w-28 min-h-28',
                          {
                            'bg-foreground-100':
                              !justAddedItem &&
                              searchSelectedItem?.id === item.id,
                            'bg-success-100': justAddedItem === item.id,
                          },
                        )}
                        onPress={() => handleAddItemToPurchase(item.id)}
                      >
                        <div className="text-xs flex items-center gap-1 text-foreground-500">
                          {item.category.name}
                          <FiArrowRight />
                        </div>

                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="object-contain -mb-1 rounded-md"
                          />
                        )}
                        <span className="text-foreground font-semibold leading-none text-wrap text-large">
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
                      <Alert
                        color="danger"
                        title={t('cashier.noItems')}
                        className="min-w-48 w-full"
                      />
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
                        className={cn(
                          'flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-800',
                          {
                            'bg-success-100 dark:bg-success-100':
                              justAddedItem === purchaseItem.itemId,
                          },
                        )}
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
                            tabIndex={-1}
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
                            tabIndex={-1}
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
                            tabIndex={-1}
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
                <p>{t('cashier.noItems')}</p>
              )}
            </div>

            <Divider className="lg:hidden my-6" />

            {/* Discount and Submit */}
            <div className="flex flex-col lg:mt-0 gap-2">
              <NumberInput
                label={t('cashier.discount')}
                startContent="-"
                endContent="€"
                tabIndex={-1}
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
    </>
  );
};

export default CashierRegister;
