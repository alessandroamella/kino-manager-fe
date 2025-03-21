import GoogleMapsAutocomplete from '@/components/input/GoogleMapsAutocomplete';
import SignatureModal from '@/components/input/SignatureModal';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import { cn } from '@/lib/utils';
import { Comune } from '@/types/Comune';
import { dateFnsLang } from '@/utils/dateFnsLang';
import { parseAddress } from '@/utils/parseAddress';
import { UTCDateMini } from '@date-fns/utc';
import type { CalendarDate } from '@heroui/react';
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  Checkbox,
  DateInput,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Image,
  Input,
  Tab,
  Tabs,
  Tooltip,
} from '@heroui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import CodiceFiscale from 'codice-fiscale-js';
import { hasFlag } from 'country-flag-icons';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { format, formatDate, subYears } from 'date-fns';
import countries from 'i18n-iso-countries';
import parsePhoneNumber from 'libphonenumber-js';
import { debounce, omit, pick } from 'lodash';
import { Key, useCallback, useEffect, useMemo, useState } from 'react';
import ReactGA from 'react-ga4';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FaEdit } from 'react-icons/fa';
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { InferType } from 'yup';
import signaturePlaceholder from '../../assets/images/firma.webp';
import useUserStore from '../../store/user';
import { getErrorMsg } from '../../types/error';
import { dateToCalendarDate } from '../../utils/calendar';
import normalize from '../../utils/normalize';
import { signupYupSchema } from '../../validators/signup';

type FormData = InferType<ReturnType<typeof signupYupSchema>>;

interface Country {
  alpha2: string;
  name: string;
}

const Signup = () => {
  const { t, i18n } = useTranslation();
  const [useCodiceFiscale, setUseCodiceFiscale] = useState(true);

  const [loading, setLoading] = useState(false);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const validationSchema = useMemo(() => signupYupSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors, isValid, touchedFields },
  } = useForm<FormData>({
    mode: 'onBlur',
    context: { useCodiceFiscale },
    resolver: yupResolver(validationSchema),
    defaultValues: {
      codiceFiscale: null,
      birthComune: null,
      birthProvince: null,
      gender: 'F',
      address: '',
      birthCountry: 'IT',
      acceptTerms: false,
    },
  });

  const [comuneSuggestions, setComuneSuggestions] = useState<Comune[]>([]);
  const [comuneSearchTerm, setComuneSearchTerm] = useState('');
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  // const [signupError, setSignupError] = useState<string | null>(null);

  const codiceFiscaleValue = watch('codiceFiscale')?.toUpperCase() || '';
  const birthComune = watch('birthComune');
  const birthCountry = watch('birthCountry');
  const address = watch('address');
  const phoneNumber = watch('phoneNumber');
  const country = watch('country');
  const gender = watch('gender');
  const signatureB64 = watch('signatureB64');
  const acceptTerms = watch('acceptTerms');

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
      setValue('birthDate', subYears(new Date(), 20));
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
    // setSignupError(null);
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
      delete obj.acceptTerms;
      delete obj.repeatPassword;

      const objNormalized = normalize(omit(obj, ['password']));

      obj = { ...objNormalized, ...pick(obj, ['password']) };

      console.log(
        'Sending signup request:',
        objNormalized,
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
      navigate(
        {
          pathname: search.get('to') || '/profile',
          search: createSearchParams({
            ...omit(Object.fromEntries(search.entries()), ['to']),
          }).toString(),
        },
        {
          state: { justSignedUp: true },
        },
      );
    } catch (error) {
      console.error('Error signing up:', getErrorMsg(error));

      addToast({
        title: t('signup.errorTitle'),
        description: getErrorMsg(error),
        color: 'danger',
      });
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

  const handleOnPlaceSelect = debounce(
    (place: google.maps.places.PlaceResult | null) => {
      if (!place) {
        console.log('Place cleared');
        trigger('address');
        return;
      }

      setValue('address', place.formatted_address);
      trigger('address');

      const parsed = parseAddress(place);
      console.log('Parsed address:', parsed);

      setValue('streetName', parsed.streetName);
      setValue('streetNumber', parsed.streetNumber);
      setValue('postalCode', parsed.postalCode);
      setValue('city', parsed.city);
      setValue('province', parsed.province);
      setValue('country', parsed.country);
    },
    300,
  );

  function handleSignatureSave(signature: string | null) {
    if (signature) {
      setValue('signatureB64', signature);
    }
    trigger('signatureB64');
    setIsSignatureModalOpen(false);
  }

  function toggleTerms(v?: unknown) {
    console.log('Toggling acceptTerms');
    setValue('acceptTerms', typeof v === 'boolean' ? v : !acceptTerms);
    trigger('acceptTerms');
  }

  return (
    <>
      <PageTitle title="signup" />
      <ScrollTop />
      <main className="py-12 mb-2 flex flex-col gap-4 relative">
        <SignatureModal
          onSaveSignature={handleSignatureSave}
          isOpen={isSignatureModalOpen}
          setIsOpen={setIsSignatureModalOpen}
        />
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
              label={t('auth.password')}
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
            <Input
              isDisabled={loading}
              label={t('auth.repeatPassword')}
              placeholder={t('signup.repeatPasswordPlaceholder')}
              type="password"
              {...register('repeatPassword')}
              isInvalid={!!errors.repeatPassword}
              errorMessage={errors.repeatPassword?.message}
              minLength={8}
              autoComplete="new-password"
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
                          date: format(
                            codiceFiscaleData.birthDate,
                            'dd/MM/yyyy',
                          ),
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
              <Tab
                key="manual"
                title={t('signup.manualTab')}
                className="w-full"
              >
                <div className="space-y-5 w-full">
                  <Controller
                    name="birthDate"
                    control={control}
                    render={({
                      field: { onChange, onBlur, value },
                      fieldState: { error },
                    }) => (
                      <DateInput
                        label={t('signup.birthDate')}
                        onChange={(date) => {
                          onChange(date);
                          handleDateChange(date);
                        }}
                        description={
                          value && touchedFields.birthDate
                            ? formatDate(value, 'dd MMMM yyyy', {
                                locale: dateFnsLang(i18n),
                              })
                            : ''
                        }
                        onBlur={() => {
                          onBlur();
                          trigger('birthDate');
                        }}
                        value={value ? dateToCalendarDate(value) : null}
                        isRequired
                        labelPlacement="outside"
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />

                  <Autocomplete
                    label={t('signup.birthCountry')}
                    placeholder={t('signup.birthCountryPlaceholder')}
                    defaultItems={countrySuggestions}
                    defaultInputValue="IT"
                    listboxProps={{
                      emptyContent: t('errors.noResults'),
                    }}
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
                        listboxProps={{
                          emptyContent: t('errors.noResults'),
                        }}
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
                  ? t('signup.addressSelected', {
                      address:
                        country && hasFlag(country)
                          ? `${getUnicodeFlagIcon(country)} ${address}`
                          : address,
                    })
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

            <div>
              <div className="flex items-center">
                <Checkbox
                  isSelected={acceptTerms}
                  onValueChange={toggleTerms}
                  isRequired
                />
                <p className="text-small cursor-pointer" onClick={toggleTerms}>
                  {t('signup.acceptTerms.pre')}
                  <Link
                    to="/docs/tos"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                  >
                    {t('signup.acceptTerms.tos')}
                  </Link>
                  {t('signup.acceptTerms.and')}
                  <Link
                    to="/docs/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                  >
                    {t('signup.acceptTerms.privacy')}
                  </Link>
                  {t('signup.acceptTerms.post')}
                </p>
              </div>
              {errors.acceptTerms && (
                <p className="text-danger text-small">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            {errors.codiceFiscale?.message}

            <Button
              color="primary"
              type="submit"
              className="w-full"
              onPress={() => !isValid && trigger()}
              isDisabled={loading}
            >
              {t('signup.registerButton')}
            </Button>

            <Divider className="mt-4" />

            <div className="flex flex-col gap-1 mt-6 items-center w-full">
              <p className="text-foreground-600 text-small">
                {t('signup.alreadyAccount')}
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
    </>
  );
};

export default Signup;
