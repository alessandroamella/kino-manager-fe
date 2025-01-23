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
import { useForm } from 'react-hook-form'; // Removed useController
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

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  codiceFiscale: string | null;
  birthDate: Date | null;
  birthComune?: string | null;
  birthCountry: string;
  address: string; // Add address to FormData
};

interface Country {
  alpha2: string;
  name: string;
}

const Signup = () => {
  const { t } = useTranslation();
  const validationSchema = useMemo(() => signupYupSchema(t), [t]);

  const [useCodiceFiscale, setUseCodiceFiscale] = useState(true);

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
      codiceFiscale: null, // Initialize codiceFiscale as null
      birthComune: null, // Initialize birthComune as null
      address: '', // Initialize address
    },
  });

  const [comuneSuggestions, setComuneSuggestions] = useState<Comune[]>([]);
  const [comuneSearchTerm, setComuneSearchTerm] = useState('');
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [signupError, setSignupError] = useState<string | null>(null); // State for signup error

  const codiceFiscaleValue = watch('codiceFiscale')?.toUpperCase() || ''; // watch can return undefined, handle it
  const birthDate = watch('birthDate');
  const birthComune = watch('birthComune');
  const birthCountry = watch('birthCountry');
  const address = watch('address');

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
      setValue('birthComune', null); // Set to null to match type
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
        // Handle cases where inverse computation fails, maybe clear fields or show an error
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
      setValue('birthComune', key?.toString() || null); // Handle null case for setValue
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
        setValue('birthCountry', key as string);
        trigger('birthCountry');
        if (key !== 'IT') {
          setValue('birthComune', null); // Clear comune if country is not Italy, set to null
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
    setSignupError(null); // Clear previous error on new submit
    console.log('Form Data:', formData);
    try {
      const obj: Partial<FormData> = { ...formData };
      if (!useCodiceFiscale) {
        delete obj.codiceFiscale;
      }
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

      // Optionally redirect or show success message here
      await login(formData.email, formData.password);
      navigate('/profile');
    } catch (error) {
      console.error('Error signing up:', error);
      setSignupError(
        (error as AxiosError)?.response?.status === 409
          ? t('errors.auth.userAlreadyExists')
          : getErrorMsg(error),
      );
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
    <div className="flex flex-col gap-4 relative">
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
              title="Errore nella registrazione"
              className="z-20"
              description={signupError}
              variant="faded"
              onClose={() => setSignupError(null)}
              closeButtonProps={{
                'aria-label': 'Chiudi avviso di errore',
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
            Iscriviti al Kinó Café
          </h2>

          {/* ... rest of your form code ... */}
          <Input
            label="Nome"
            placeholder="Inserisci il tuo nome"
            {...register('firstName')}
            isInvalid={Boolean(errors.firstName)}
            errorMessage={errors.firstName?.message}
            autoComplete="given-name"
            isRequired
          />
          <Input
            label="Cognome"
            placeholder="Inserisci il tuo cognome"
            {...register('lastName')}
            isInvalid={Boolean(errors.lastName)}
            errorMessage={errors.lastName?.message}
            autoComplete="family-name"
            isRequired
          />
          <Input
            label="Email"
            placeholder="Inserisci la tua email"
            type="email"
            {...register('email')}
            description={t('signup.emailDisclaimer')}
            isInvalid={Boolean(errors.email)}
            autoComplete="email"
            errorMessage={errors.email?.message}
            isRequired
          />
          <Input
            label="Password"
            placeholder="Inserisci la tua password"
            type="password"
            {...register('password')}
            isInvalid={Boolean(errors.password)}
            errorMessage={errors.password?.message}
            minLength={8}
            autoComplete="new-password"
            description={t('signup.passwordDisclaimer')}
            isRequired
          />

          <Divider className="my-4" />

          <div>
            <h2 className="text-lg font-bold text-foreground">
              Dati Anagrafici
            </h2>
            <p className="text-foreground-500 text-small">
              Se hai un codice fiscale, inseriscilo per compilare
              automaticamente i tuoi dati anagrafici.
              <br />
              Se non hai un codice fiscale, clicca su &quot;Manuale&quot; per
              inserire i dati manualmente.
            </p>
          </div>

          <Tabs
            onSelectionChange={handleSelectionChange}
            aria-label="Registrazione con o senza codice fiscale"
            fullWidth
          >
            <Tab key="codice-fiscale" title="Codice fiscale" className="w-full">
              <Input
                label="Codice Fiscale"
                placeholder="Inserisci il tuo codice fiscale"
                isRequired={useCodiceFiscale} // Conditionally require based on tab
                {...register('codiceFiscale')}
                isInvalid={Boolean(errors.codiceFiscale)}
                errorMessage={errors.codiceFiscale?.message}
                maxLength={16}
                // description="Inserisci il tuo codice fiscale per compilare automaticamente i dati anagrafici"
                description={
                  codiceFiscaleData
                    ? `Valido! ${format(
                        codiceFiscaleData.birthDate,
                        'dd/MM/yyyy',
                      )} - ${codiceFiscaleData.birthplace}`
                    : codiceFiscaleValue.length === 16
                    ? 'Codice fiscale non valido :/'
                    : 'Inserisci il tuo codice fiscale per compilare automaticamente i dati anagrafici'
                }
              />
            </Tab>
            <Tab key="manual" title="Manuale" className="w-full">
              <div className="space-y-5 w-full">
                <DatePicker
                  label="Data di Nascita"
                  onChange={handleDateChange}
                  onBlur={() => trigger('birthDate')}
                  value={birthDate ? dateToCalendarDate(birthDate) : null}
                  isRequired
                  labelPlacement="outside"
                  isInvalid={Boolean(errors.birthDate)}
                  errorMessage={errors.birthDate?.message}
                />
                <Autocomplete
                  label="Paese di Nascita"
                  placeholder="Inizia a digitare il paese"
                  defaultItems={countrySuggestions}
                  defaultInputValue="IT"
                  items={countrySuggestions}
                  onInputChange={handleCountryInputChange}
                  onSelectionChange={handleCountryChange}
                  isRequired
                  labelPlacement="outside"
                  {...register('birthCountry')}
                  isInvalid={Boolean(errors.birthCountry)}
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
                    label="Comune di Nascita"
                    placeholder="Inizia a digitare il comune"
                    items={comuneSuggestions}
                    onSelectionChange={handleComuneChange}
                    onInputChange={handleComuneInputChange}
                    isRequired
                    labelPlacement="outside"
                    {...register('birthComune')}
                    isInvalid={Boolean(errors.birthComune)}
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
            label="Indirizzo"
            placeholder="Inserisci il tuo indirizzo"
            isInvalid={Boolean(errors.address)}
            errorMessage={errors.address?.message}
            isRequired
            onPlaceSelect={(place) => {
              setValue('address', place?.formatted_address || ''); // Still use setValue to update form value
            }}
            description={
              address
                ? `Indirizzo selezionato: ${address}`
                : 'Inserisci il tuo indirizzo di residenza'
            }
            onBlur={() => trigger('address')}
          />

          <Button
            color="primary"
            type="submit"
            className="w-full"
            isDisabled={!isValid}
          >
            Registrati
          </Button>

          <div className="flex flex-col gap-1 mt-4 items-center w-full">
            <p className="text-foreground-600 text-small">
              Hai già un account?{' '}
            </p>
            <Button
              as={Link}
              to="/auth/login"
              size="sm"
              type="button"
              variant="bordered"
              className="text-small w-full"
            >
              Accedi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Signup;
