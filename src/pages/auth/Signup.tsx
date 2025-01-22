import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Form,
  Input,
  Button,
  Autocomplete,
  AutocompleteItem,
  DatePicker,
  Alert, // Import Alert component
} from '@heroui/react';
import type { CalendarDate } from '@heroui/react';
import { CalendarDate as ICalendarDate } from '@internationalized/date';
import CodiceFiscale from 'codice-fiscale-js';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Comune } from 'codice-fiscale-js/types/comune';
import countries from 'i18n-iso-countries';
import { useTranslation } from 'react-i18next';
import { getDay, getMonth, getYear, parse } from 'date-fns';
import { getErrorMsg } from '../../types/error';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  codiceFiscale: string;
  birthDate: Date | null;
  birthComune?: string;
  birthCountry: string;
};

interface Country {
  alpha2: string;
  name: string;
}

function dateToCalendarDate(date: Date): CalendarDate {
  const year = getYear(date);
  const month = getMonth(date) + 1;
  const day = getDay(date);

  return new ICalendarDate(year, month, day) as unknown as CalendarDate;
}

const Signup = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid: _isValid },
  } = useForm<FormData>({
    mode: 'onBlur',
  });
  const [useCodiceFiscale, setUseCodiceFiscale] = useState(true);
  const [comuneSuggestions, setComuneSuggestions] = useState<Comune[]>([]);
  const [comuneSearchTerm, setComuneSearchTerm] = useState('');
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [signupError, setSignupError] = useState<string | null>(null); // State for signup error

  const codiceFiscaleValue = watch('codiceFiscale');
  const birthDate = watch('birthDate');
  const birthComune = watch('birthComune');
  const birthCountry = watch('birthCountry');

  const { t } = useTranslation();

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
    if (
      useCodiceFiscale &&
      codiceFiscaleValue &&
      codiceFiscaleValue.length === 16
    ) {
      if (CodiceFiscale.check(codiceFiscaleValue.toUpperCase())) {
        const data = CodiceFiscale.computeInverse(
          codiceFiscaleValue.toUpperCase(),
        );
        setUseCodiceFiscale(true);
        // data.year,
        // data.month,
        // data.day,
        const birthDate = parse(
          `${data.year}-${data.month}-${data.day}`,
          'yyyy-MM-dd',
          new Date(),
        );

        setValue('birthDate', birthDate);
        setValue('birthCountry', 'IT');
        setValue('birthComune', data.birthplace);
        trigger(['birthDate', 'birthCountry', 'birthComune']);
      } else {
        setValue('birthDate', null);
        setValue('birthCountry', '');
        setValue('birthComune', '');
        trigger(['birthDate', 'birthCountry', 'birthComune']); // Clear and trigger validation for these fields
      }
    } else if (
      useCodiceFiscale &&
      codiceFiscaleValue &&
      codiceFiscaleValue.length < 16
    ) {
      setValue('birthDate', null);
      setValue('birthCountry', '');
      setValue('birthComune', '');
      trigger(['birthDate', 'birthCountry', 'birthComune']);
    } else if (useCodiceFiscale && !codiceFiscaleValue) {
      setValue('birthDate', null);
      setValue('birthCountry', '');
      setValue('birthComune', '');
      trigger(['birthDate', 'birthCountry', 'birthComune']);
    }
  }, [codiceFiscaleValue, setValue, useCodiceFiscale, trigger]);

  const handleDateChange = useCallback(
    (date: CalendarDate | null) => {
      setValue('birthDate', date ? date.toDate('UTC') : null);
      trigger('birthDate');
    },
    [setValue, trigger],
  );

  const handleComuneChange = useCallback(
    (key: React.Key | null) => {
      setValue('birthComune', key?.toString());
      trigger('birthComune');
    },
    [setValue, trigger],
  );

  const handleComuneInputChange = useCallback((value: string) => {
    setComuneSearchTerm(value);
  }, []);

  const handleCountryChange = useCallback(
    (key: React.Key | null) => {
      if (key) {
        setValue('birthCountry', key as string);
        trigger('birthCountry');
        if (key !== 'IT') {
          setValue('birthComune', undefined); // Clear comune if country is not Italy
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
      setComuneSuggestions([]);
    }
  }, [comuneSearchTerm]);

  const onSubmit = async (formData: FormData) => {
    setSignupError(null); // Clear previous error on new submit
    console.log('Form Data:', formData);
    try {
      const obj: Partial<FormData> = { ...formData };
      if (!useCodiceFiscale) {
        delete obj.codiceFiscale;
      }
      const { data } = await axios.post('/v1/auth/signup', obj);
      console.log('Signup successful:', data);
      // Optionally redirect or show success message here
    } catch (error) {
      console.error('Error signing up:', error);
      setSignupError(getErrorMsg(error));
    }
  };

  const isItalySelected = birthCountry === 'IT';

  const cfOkay = useMemo(() => {
    return (
      codiceFiscaleValue &&
      codiceFiscaleValue.length === 16 &&
      CodiceFiscale.check(codiceFiscaleValue.toUpperCase())
    );
  }, [codiceFiscaleValue]);

  const isValid =
    _isValid &&
    (useCodiceFiscale
      ? cfOkay
      : birthDate && birthCountry && (isItalySelected ? birthComune : true));

  return (
    <div className="flex flex-col gap-4">
      {signupError && (
        <Alert
          color="danger"
          title="Errore di Registrazione"
          description={signupError}
          variant="faded"
        />
      )}
      <Form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg mx-auto mt-2 md:mt-4 p-6 rounded-md shadow-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Iscriviti al Kinó Café
        </h2>

        <Input
          label="Nome"
          placeholder="Inserisci il tuo nome"
          {...register('firstName', { required: 'Il nome è obbligatorio' })}
          isInvalid={Boolean(errors.firstName)}
          errorMessage={errors.firstName?.message}
          isRequired
        />
        <Input
          label="Cognome"
          placeholder="Inserisci il tuo cognome"
          {...register('lastName', { required: 'Il cognome è obbligatorio' })}
          isInvalid={Boolean(errors.lastName)}
          errorMessage={errors.lastName?.message}
          isRequired
        />
        <Input
          label="Email"
          placeholder="Inserisci la tua email"
          type="email"
          {...register('email', {
            required: "L'email è obbligatoria",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Inserisci un'email valida",
            },
          })}
          isInvalid={Boolean(errors.email)}
          errorMessage={errors.email?.message}
          isRequired
        />
        <Input
          label="Password"
          placeholder="Inserisci la tua password"
          type="password"
          {...register('password', { required: 'La password è obbligatoria' })}
          isInvalid={Boolean(errors.password)}
          errorMessage={errors.password?.message}
          isRequired
        />

        <hr />

        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Dati Anagrafici
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <p className="text-gray-800 dark:text-gray-100">
            Hai un codice fiscale?
          </p>
          <div className="flex mx-auto space-x-4">
            <Button
              color="primary"
              onPress={() => setUseCodiceFiscale(true)}
              className="w-1/2"
              isDisabled={useCodiceFiscale}
            >
              Sì
            </Button>
            <Button
              color="warning"
              onPress={() => setUseCodiceFiscale(false)}
              className="w-1/2"
              isDisabled={!useCodiceFiscale}
            >
              No
            </Button>
          </div>
        </div>

        {useCodiceFiscale && (
          <Input
            label="Codice Fiscale"
            placeholder="Inserisci il tuo codice fiscale"
            isRequired
            {...register('codiceFiscale', {
              required: useCodiceFiscale
                ? 'Il codice fiscale è obbligatorio'
                : false,
              validate: useCodiceFiscale
                ? (value) => {
                    if (!value) return true; // required handles empty case
                    if (value.length !== 16)
                      return 'Il codice fiscale deve essere di 16 caratteri';
                    if (!cfOkay) {
                      return 'Codice fiscale non valido';
                    }
                    return true;
                  }
                : undefined,
            })}
            isInvalid={Boolean(errors.codiceFiscale)}
            errorMessage={errors.codiceFiscale?.message}
            maxLength={16}
            description="Inserisci il tuo codice fiscale per compilare automaticamente i dati anagrafici"
          />
        )}

        {!useCodiceFiscale && (
          <div className="space-y-5 w-full">
            <DatePicker
              label="Data di Nascita"
              onChange={handleDateChange}
              value={birthDate ? dateToCalendarDate(birthDate) : null}
              isRequired
              labelPlacement="outside"
              // {...register('birthDate', {
              //   required: !useCodiceFiscale ? 'La data di nascita è obbligatoria' : false,
              // })}
              isInvalid={Boolean(errors.birthDate)}
              errorMessage={errors.birthDate?.message}
            />
            <Autocomplete
              label="Paese di Nascita"
              placeholder="Inizia a digitare il paese"
              defaultItems={countrySuggestions}
              items={countrySuggestions}
              onInputChange={handleCountryInputChange}
              onSelectionChange={handleCountryChange}
              isRequired
              labelPlacement="outside"
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
                defaultItems={comuneSuggestions}
                defaultSelectedKey={birthComune}
                selectedKey={birthComune}
                onSelectionChange={handleComuneChange}
                onInputChange={handleComuneInputChange}
                isRequired
                labelPlacement="outside"
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
        )}

        <Button
          color="primary"
          type="submit"
          className="w-full"
          isDisabled={!isValid}
        >
          Registrati
        </Button>
      </Form>
    </div>
  );
};

export default Signup;
