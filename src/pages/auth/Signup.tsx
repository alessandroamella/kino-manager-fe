// Signup.tsx
import React, { useState, useEffect, useCallback, useMemo, Key } from 'react';
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
} from '@heroui/react';
import type { CalendarDate } from '@heroui/react';
import CodiceFiscale from 'codice-fiscale-js';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { yupResolver } from '@hookform/resolvers/yup';
import { Comune } from 'codice-fiscale-js/types/comune';
import countries from 'i18n-iso-countries';
import { useTranslation } from 'react-i18next';
import { getErrorMsg } from '../../types/error';
import { dateToCalendarDate } from '../../utils/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router';
import useUserStore from '../../store/user';
import { UTCDateMini } from '@date-fns/utc';
import { signupYupSchema } from '../../validators/signup';
import { format } from 'date-fns';
import ReactGA from 'react-ga4';
import GoogleMapsAutocomplete from '../../components/GoogleMapsAutocomplete';
import parsePhoneNumber from 'libphonenumber-js';
import normalize from '../../utils/normalize';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  codiceFiscale: string | null;
  birthDate: Date | null;
  birthComune?: string | null;
  birthCountry: string;
  address: string;
};

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
    defaultValues: {
      codiceFiscale: null,
      birthComune: null,
      address: '',
      birthCountry: 'IT', // Default to Italy, or your preferred default
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
  const birthCountry = watch('birthCountry'); // Keep watching birthCountry
  const address = watch('address');
  const phoneNumber = watch('phoneNumber');

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
      setValue('birthDate', null);
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
        trigger(['birthDate', 'birthCountry', 'birthComune']);
      } catch (error) {
        console.error('Error computing inverse CF:', error);
        setValue('birthDate', null);
        setValue('birthCountry', '');
        setValue('birthComune', null);
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
      setValue('birthDate', date ? date.toDate('UTC') : null);
      trigger('birthDate');
    },
    [setValue, trigger],
  );

  const handleComuneChange = useCallback(
    (key: React.Key | null) => {
      console.log('Comune selected:', key);
      if (!key && !birthComune) {
        return;
      }
      setValue('birthComune', key?.toString() || null);
      trigger('birthComune');
    },
    [birthComune, setValue, trigger],
  );

  const handleComuneInputChange = useCallback((value: string) => {
    setComuneSearchTerm(value);
  }, []);

  const handleCountryChange = useCallback(
    (key: React.Key | null) => {
      console.log('Country selected:', key);
      if (key) {
        setValue('birthCountry', key as string); // Correctly set birthCountry with alpha2 code
        trigger('birthCountry');
        if (key !== 'IT') {
          setValue('birthComune', null);
          trigger('birthComune');
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

  const onSubmit = async (formData: FormData) => {
    setSignupError(null);
    setLoading(true);
    console.log('Form Data:', formData);
    try {
      let obj: Partial<FormData> = { ...formData };
      if (!useCodiceFiscale) {
        delete obj.codiceFiscale;
      }
      obj.phoneNumber = parsePhoneNumber(
        formData.phoneNumber,
        'IT',
      )?.formatInternational();
      console.log('Formatted phone number:', obj.phoneNumber);
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
      navigate('/profile');
    } catch (error) {
      console.error('Error signing up:', error);
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
      setValue('birthComune', null);
      setComuneSuggestions([]);
      trigger('birthComune');
    }
  }

  return (
    <main className="py-12 mb-2 flex flex-col gap-4 relative">
      <AnimatePresence>
        {signupError && (
          <motion.div
            className="sticky top-4 md:top-20 mx-4 md:w-fit md:ml-auto z-10"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Alert
              color="danger"
              title={t('signup.errorTitle')}
              className="z-20"
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
                  <Autocomplete
                    label={t('signup.birthComune')}
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
                      <AutocompleteItem key={item.nome}>
                        {item.nome}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
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
            onPlaceSelect={(place) => {
              setValue('address', place?.formatted_address || '');
            }}
            description={
              address
                ? t('signup.addressSelected', { address: address })
                : t('signup.addressDescription')
            }
            onBlur={() => trigger('address')}
          />

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
