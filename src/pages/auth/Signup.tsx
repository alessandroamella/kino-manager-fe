import { useState, useEffect, useCallback, useMemo, Key } from 'react';
import {
  Form,
  Input,
  Button,
  Autocomplete,
  AutocompleteItem,
  DatePicker,
  Alert,
  Divider,
  Tab,
  Tabs,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
  Image,
} from '@heroui/react';
import type { CalendarDate } from '@heroui/react';
import CodiceFiscale from 'codice-fiscale-js';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { yupResolver } from '@hookform/resolvers/yup';
import countries from 'i18n-iso-countries';
import { useTranslation } from 'react-i18next';
import { getErrorMsg } from '../../types/error';
import { dateToCalendarDate } from '../../utils/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router';
import useUserStore from '../../store/user';
import { UTCDateMini } from '@date-fns/utc';
import { signupYupSchema } from '../../validators/signup';
import { format, subYears } from 'date-fns';
import ReactGA from 'react-ga4';
import parsePhoneNumber from 'libphonenumber-js';
import normalize from '../../utils/normalize';
import { Comune } from '@/types/Comune';
import { InferType } from 'yup';
import { parseAddress } from '@/utils/parseAddress';
import SignatureModal from '@/components/input/SignatureModal';
import GoogleMapsAutocomplete from '@/components/input/GoogleMapsAutocomplete';
import { FaEdit } from 'react-icons/fa';
import signaturePlaceholder from '../../assets/images/firma.webp';
import { cn } from '@/lib/utils';

type FormData = InferType<ReturnType<typeof signupYupSchema>>;

interface Country {
  alpha2: string;
  name: string;
}

const Signup = () => {
  const { t } = useTranslation();
  const [useCodiceFiscale, setUseCodiceFiscale] = useState(true);

  const [loading, setLoading] = useState(false);

  const validationSchema = useMemo(
    () => signupYupSchema(t, useCodiceFiscale),
    [t, useCodiceFiscale],
  );

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onBlur',
    resolver: yupResolver(validationSchema, {
      context: { useCodiceFiscale },
    }),
    defaultValues: {
      codiceFiscale: null,
      birthComune: null,
      birthProvince: null,
      gender: 'F',
      address: '',
      birthCountry: 'IT',
    },
  });

  const [comuneSuggestions, setComuneSuggestions] = useState<Comune[]>([]);
  const [comuneSearchTerm, setComuneSearchTerm] = useState('');
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [signupError, setSignupError] = useState<string | null>(null);

  const codiceFiscaleValue = watch('codiceFiscale')?.toUpperCase() || '';
  const birthDate = watch('birthDate');
  const birthComune = watch('birthComune');
  const birthCountry = watch('birthCountry');
  const address = watch('address');
  const phoneNumber = watch('phoneNumber');
  const gender = watch('gender');
  const signatureB64 = watch('signatureB64');

  const phoneCountry = useMemo(() => {
    if (!phoneNumber) {
      return null;
    }
    const formatted = parsePhoneNumber(phoneNumber, 'IT');
    return formatted?.country || null;
  }, [phoneNumber]);

  const codiceFiscaleData = useMemo(() => {
    if (
      codiceFiscaleValue.length !== 16 ||
      !CodiceFiscale.check(codiceFiscaleValue)
    ) {
      return null;
    }

    try {
      const data = CodiceFiscale.computeInverse(codiceFiscaleValue);
      return {
        ...data,
        birthDate: new UTCDateMini(data.year, data.month - 1, data.day),
      };
    } catch (error) {
      console.error('Error computing inverse CF:', error);
      return null;
    }
  }, [codiceFiscaleValue]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const countryAlpha2Codes = Object.keys(countries.getAlpha2Codes());
    const countriesArray: Country[] = [];
    for (const alpha2 of countryAlpha2Codes) {
      countriesArray.push({ alpha2, name: t(`countries.${alpha2}`) });
    }
    setCountriesList(countriesArray);
    setCountrySuggestions(countriesArray);
  }, [t]);

  useEffect(() => {
    if (countrySearchTerm.length > 0) {
      const filteredCountries = countriesList.filter((country) =>
        t(`countries.${country.alpha2}`)
          .toLowerCase()
          .includes(countrySearchTerm.toLowerCase()),
      );
      setCountrySuggestions(filteredCountries);
    } else {
      setCountrySuggestions(countriesList);
    }
  }, [countrySearchTerm, countriesList, t]);

  useEffect(() => {
    if (!useCodiceFiscale) {
      return;
    } else if (!codiceFiscaleData) {
      setValue('birthDate', subYears(new Date(), 18));
      setValue('birthCountry', '');
      setValue('birthComune', null);
      trigger(['birthDate', 'birthCountry', 'birthComune']);
      return;
    }

    if (
      useCodiceFiscale &&
      codiceFiscaleValue &&
      CodiceFiscale.check(codiceFiscaleValue)
    ) {
      try {
        const data = CodiceFiscale.computeInverse(codiceFiscaleValue);
        const birthDateFromCF = new UTCDateMini(
          data.year,
          data.month - 1,
          data.day,
        );

        setValue('birthDate', birthDateFromCF);
        setValue('birthCountry', 'IT');
        setValue('birthComune', data.birthplace);
        setValue('birthProvince', data.birthplaceProvincia);
        setValue('gender', data.gender);
        trigger(['birthDate', 'birthCountry', 'birthComune']);
      } catch (error) {
        console.error('Error computing inverse CF:', error);
        setValue('birthDate', subYears(new Date(), 18));
        setValue('birthCountry', '');
        setValue('birthComune', null);
        setValue('birthProvince', null);
        setValue('gender', null);
        trigger(['birthDate', 'birthCountry', 'birthComune']);
      }
    }
  }, [
    codiceFiscaleValue,
    setValue,
    useCodiceFiscale,
    trigger,
    codiceFiscaleData,
  ]);

  const handleDateChange = useCallback(
    (date: CalendarDate | null) => {
      console.log('Date selected:', date);
      if (!date) {
        return;
      }
      setValue('birthDate', date.toDate('UTC'));
      trigger('birthDate');
    },
    [setValue, trigger],
  );

  const handleComuneChange = useCallback(
    (key: Key | null) => {
      console.log('Comune selected:', key);
      if (!key && !birthComune) {
        return;
      }
      const k = key?.toString().split('|');
      if (k?.length === 2 && k.every(Boolean)) {
        setValue('birthComune', k[0]);
        setValue('birthProvince', k[1]);
      } else {
        console.warn('Invalid comune key:', key);
      }
      trigger('birthComune');
    },
    [birthComune, setValue, trigger],
  );

  const handleComuneInputChange = useCallback((value: string) => {
    setComuneSearchTerm(value);
  }, []);

  const handleCountryChange = useCallback(
    (key: Key | null) => {
      console.log('Country selected:', key);
      if (key) {
        setValue('birthCountry', key as string);
        trigger('birthCountry');
        if (key !== 'IT') {
          console.log('Clearing comune and province');
          setValue('birthComune', null);
          setValue('birthProvince', null);
          trigger('birthComune');
          trigger('birthProvince');
        }
      }
    },
    [setValue, trigger],
  );

  const handleCountryInputChange = useCallback((value: string) => {
    setCountrySearchTerm(value);
  }, []);

  useEffect(() => {
    if (comuneSearchTerm.length > 0) {
      const fetchComuni = async () => {
        try {
          const { data } = await axios.get<Comune[]>(
            `/v1/istat/comune?q=${comuneSearchTerm}`,
          );
          console.log(
            'Setting comune suggestions:',
            data.map((e) => e.nome).join(', '),
          );
          setComuneSuggestions(data);
        } catch (error) {
          console.error('Error fetching comuni:', error);
          setComuneSuggestions([]);
        }
      };

      const timeoutId = setTimeout(() => {
        fetchComuni();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      console.log('Clearing comune suggestions');
      setComuneSuggestions([]);
    }
  }, [comuneSearchTerm]);

  const login = useUserStore((store) => store.login);
  const navigate = useNavigate();

  const [search] = useSearchParams();

  const onSubmit = async (formData: FormData) => {
    setSignupError(null);
    setLoading(true);
    console.log('Form Data:', formData);
    try {
      let obj: Partial<FormData> = { ...formData };
      if (!useCodiceFiscale) {
        // let's try crafting a manual codice fiscale
        let cfGuessValid = true;
        if (obj.birthCountry === 'IT' && obj.birthComune) {
          const [day, month, year] = [
            obj.birthDate?.getDate(),
            obj.birthDate?.getMonth(),
            obj.birthDate?.getFullYear(),
          ];
          if (!obj.birthDate || !obj.birthProvince) {
            cfGuessValid = false;
          }
          if (cfGuessValid) {
            try {
              obj.codiceFiscale = new CodiceFiscale({
                birthplace: obj.birthComune!,
                birthplaceProvincia: obj.birthProvince!,
                day: day!,
                month: month! + 1,
                year: year!,
                gender: obj.gender === 'F' ? 'F' : 'M',
                name: obj.firstName!,
                surname: obj.lastName!,
              }).toString();
            } catch (err) {
              console.warn('Error creating CF:', err);
              cfGuessValid = false;
            }
          }
        }

        if (!cfGuessValid) {
          delete obj.codiceFiscale;
        }
      }
      obj.phoneNumber = parsePhoneNumber(
        formData.phoneNumber,
        'IT',
      )?.formatInternational();
      console.log('Formatted phone number:', obj.phoneNumber);

      delete obj.birthProvince;

      obj = normalize(obj); // remove undefined and empty strings
      console.log(
        'Sending signup request:',
        obj,
        'useCodiceFiscale:',
        useCodiceFiscale,
      );
      const { data } = await axios.post('/v1/auth/signup', obj);
      console.log('Signup successful:', data);

      ReactGA.event({
        category: 'User',
        action: 'Signed Up',
      });

      await login(formData.email, formData.password);
      navigate(search.get('to') || '/profile');
    } catch (error) {
      console.error('Error signing up:', getErrorMsg(error));
      setSignupError(
        (error as AxiosError)?.response?.status === 409
          ? t('errors.auth.userAlreadyExists')
          : getErrorMsg(error),
      );
    } finally {
      setLoading(false);
    }
  };

  const isItalySelected = birthCountry === 'IT';

  function handleSelectionChange(key: Key) {
    setUseCodiceFiscale(key === 'codice-fiscale');
    if (key === 'manual') {
      setComuneSuggestions([]);
    }
  }

  function handleOnPlaceSelect(place: google.maps.places.PlaceResult | null) {
    if (!place) {
      trigger('address');
      return;
    }

    setValue('address', place.formatted_address);
    trigger('address');

    const parsed = parseAddress(place);
    setValue('streetName', parsed.streetName);
    setValue('streetNumber', parsed.streetNumber);
    setValue('postalCode', parsed.postalCode);
    setValue('city', parsed.city);
    setValue('province', parsed.province);
    setValue('country', parsed.country);
  }

  function handleSignatureSave(signature: string | null) {
    if (signature) {
      setValue('signatureB64', signature);
    }
    trigger('signatureB64');
    setIsSignatureModalOpen(false);
  }

  return (
    <main className="py-12 mb-2 flex flex-col gap-4 relative">
      <SignatureModal
        onSaveSignature={handleSignatureSave}
        isOpen={isSignatureModalOpen}
        setIsOpen={setIsSignatureModalOpen}
      />
      <AnimatePresence>
        {signupError && (
          <motion.div
            className="sticky top-20 mx-4 md:w-fit rounded-xl dark:bg-red-500/50 md:ml-auto z-10"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Alert
              color="danger"
              title={t('signup.errorTitle')}
              description={signupError}
              variant="faded"
              onClose={() => setSignupError(null)}
              closeButtonProps={{
                'aria-label': t('signup.errorCloseAria'),
                type: 'button',
                onPress: () => setSignupError(null),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-fit mx-auto">
        <Form
          onSubmit={handleSubmit(onSubmit)}
          className="md:min-w-[500px] max-w-lg mx-auto -mt-2 md:mt-4 p-6 rounded-md shadow-md space-y-4"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t('signup.title')}
          </h2>

          <Input
            isDisabled={loading}
            label={t('signup.firstName')}
            placeholder={t('signup.firstNamePlaceholder')}
            {...register('firstName')}
            isInvalid={!!errors.firstName}
            errorMessage={errors.firstName?.message}
            autoComplete="given-name"
            isRequired
          />
          <Input
            isDisabled={loading}
            label={t('signup.lastName')}
            placeholder={t('signup.lastNamePlaceholder')}
            {...register('lastName')}
            isInvalid={!!errors.lastName}
            errorMessage={errors.lastName?.message}
            autoComplete="family-name"
            isRequired
          />
          <Input
            isDisabled={loading}
            label={t('signup.email')}
            placeholder={t('signup.emailPlaceholder')}
            type="email"
            {...register('email')}
            description={t('signup.emailDisclaimer')}
            isInvalid={!!errors.email}
            autoComplete="email"
            errorMessage={errors.email?.message}
            isRequired
          />
          <Input
            isDisabled={loading}
            label={t('signup.phoneNumber')}
            placeholder={t('signup.phoneNumberPlaceholder')}
            type="tel"
            {...register('phoneNumber')}
            description={`${
              phoneCountry && phoneCountry !== 'IT'
                ? t('profile.hi', { name: t(`countries.${phoneCountry}`) }) +
                  ' 😎 '
                : ''
            }${t('signup.phoneNumberDisclaimer')}`}
            isInvalid={!!errors.phoneNumber}
            errorMessage={errors.phoneNumber?.message}
            autoComplete="tel"
            isRequired
          />
          <Input
            isDisabled={loading}
            label={t('signup.password')}
            placeholder={t('signup.passwordPlaceholder')}
            type="password"
            {...register('password')}
            onValueChange={() => phoneNumber && trigger('phoneNumber')}
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
            minLength={8}
            autoComplete="new-password"
            description={t('signup.passwordDisclaimer')}
            isRequired
          />

          <Divider className="my-4" />

          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t('signup.personalDataHeading')}
            </h2>
            <p className="text-foreground-500 text-small">
              {t('signup.personalDataDescription')}
            </p>
          </div>

          <Tabs
            onSelectionChange={handleSelectionChange}
            aria-label={t('signup.tabsAriaLabel')}
            fullWidth
          >
            <Tab
              key="codice-fiscale"
              title={t('signup.cfTab')}
              className="w-full"
            >
              <Input
                isDisabled={loading}
                label={t('signup.codiceFiscale')}
                placeholder={t('signup.codiceFiscalePlaceholder')}
                isRequired={useCodiceFiscale}
                {...register('codiceFiscale')}
                isInvalid={!!errors.codiceFiscale}
                errorMessage={errors.codiceFiscale?.message}
                maxLength={16}
                description={
                  codiceFiscaleData
                    ? t('signup.cfValid', {
                        date: format(codiceFiscaleData.birthDate, 'dd/MM/yyyy'),
                        birthplace:
                          codiceFiscaleData.birthplace.toLowerCase() ===
                          'modena'
                            ? 'Mudnés 🟡🔵'
                            : codiceFiscaleData.birthplace,
                      })
                    : codiceFiscaleValue.length === 16
                    ? t('signup.cfInvalid')
                    : t('signup.cfDescription')
                }
              />
            </Tab>
            <Tab key="manual" title={t('signup.manualTab')} className="w-full">
              <div className="space-y-5 w-full">
                <DatePicker
                  label={t('signup.birthDate')}
                  onChange={handleDateChange}
                  onBlur={() => trigger('birthDate')}
                  value={birthDate ? dateToCalendarDate(birthDate) : null}
                  isRequired
                  labelPlacement="outside"
                  isInvalid={!!errors.birthDate}
                  errorMessage={errors.birthDate?.message}
                />
                <Autocomplete
                  label={t('signup.birthCountry')}
                  placeholder={t('signup.birthCountryPlaceholder')}
                  defaultItems={countrySuggestions}
                  defaultInputValue="IT"
                  items={countrySuggestions}
                  onInputChange={handleCountryInputChange}
                  onSelectionChange={handleCountryChange} // Use handleCountryChange to manage value
                  isRequired
                  labelPlacement="outside"
                  // {...register('birthCountry')}  // REMOVE register here
                  isInvalid={!!errors.birthCountry}
                  errorMessage={errors.birthCountry?.message}
                >
                  {(item) => (
                    <AutocompleteItem key={item.alpha2}>
                      {t('countries.' + item.alpha2)}
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                {isItalySelected && (
                  <div className="flex gap-2 -mb-2">
                    <Autocomplete
                      label={t('signup.birthComune')}
                      className="col-span-2"
                      placeholder={t('signup.birthComunePlaceholder')}
                      items={comuneSuggestions}
                      onSelectionChange={handleComuneChange}
                      onInputChange={handleComuneInputChange}
                      isRequired
                      labelPlacement="outside"
                      {...register('birthComune')}
                      isInvalid={!!errors.birthComune}
                      errorMessage={errors.birthComune?.message}
                    >
                      {(item) => (
                        <AutocompleteItem
                          key={item.nome + '|' + item.provincia.sigla}
                        >
                          {item.nome}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>

                    <div className="flex flex-col gap-1 min-w-32">
                      <label
                        htmlFor="gender"
                        className="text-small text-foreground-600"
                      >
                        {t('signup.gender')}
                      </label>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="bordered">
                            {t(`gender.${gender}`)}
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          id="gender"
                          onAction={(k) => setValue('gender', k.toString())}
                          aria-label={t('signup.gender')}
                          items={['M', 'F', 'X'].map((e) => ({
                            key: e,
                            label: t(`gender.${e}`),
                          }))}
                        >
                          {(item) => (
                            <DropdownItem key={item.key}>
                              {item.label}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>

          <GoogleMapsAutocomplete
            label={t('signup.address')}
            placeholder={t('signup.addressPlaceholder')}
            isInvalid={!!errors.address}
            errorMessage={errors.address?.message}
            isRequired
            onPlaceSelect={handleOnPlaceSelect}
            description={
              address
                ? t('signup.addressSelected', { address: address })
                : t('signup.addressDescription')
            }
            onBlur={() => trigger('address')}
          />

          <div className="flex flex-col gap-2 w-full min-w-32">
            <div className="flex justify-between items-center gap-2">
              <label
                htmlFor="gender"
                className="text-small text-foreground-600"
              >
                {t('signup.signature')}
              </label>
              <Tooltip content={t('signup.editSignature')}>
                <Button
                  isIconOnly
                  onPress={() => setIsSignatureModalOpen(true)}
                >
                  <FaEdit />
                </Button>
              </Tooltip>
            </div>
            <Image
              onClick={() => setIsSignatureModalOpen(true)}
              src={signatureB64 || signaturePlaceholder}
              alt={t('signup.signature')}
              className={cn('w-full cursor-pointer border-2', {
                'border-danger-500': errors.signatureB64,
              })}
            />
            {errors.signatureB64 && (
              <p className="text-danger text-center text-small">
                {errors.signatureB64.message}
              </p>
            )}
          </div>

          <Button
            color="primary"
            type="submit"
            className="w-full"
            isDisabled={loading || !isValid}
          >
            {t('signup.registerButton')}
          </Button>

          <div className="flex flex-col gap-1 mt-4 items-center w-full">
            <p className="text-foreground-600 text-small">
              {t('signup.alreadyAccount')}{' '}
            </p>
            <Button
              as={Link}
              to="/auth/login"
              size="sm"
              type="button"
              variant="bordered"
              className="text-small w-full"
            >
              {t('auth.login')}
            </Button>
          </div>
        </Form>
      </Card>
    </main>
  );
};

export default Signup;
