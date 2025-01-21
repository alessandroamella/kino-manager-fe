import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Autocomplete,
  AutocompleteItem,
  DatePicker,
  DateValue,
} from '@heroui/react';
import type { CalendarDate } from '@heroui/react';
import { CalendarDate as ICalendarDate } from '@internationalized/date';
import CodiceFiscale from 'codice-fiscale-js';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Comune } from 'codice-fiscale-js/types/comune';
import { format } from 'date-fns';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  codiceFiscale: string;
  birthDate: DateValue | null;
  birthComune: string;
  birthCountry: 'Italy';
};

const Signup = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();
  const [useCodiceFiscale, setUseCodiceFiscale] = useState(true);
  const [comuneSuggestions, setComuneSuggestions] = useState<Comune[]>([]);
  const [comuneSearchTerm, setComuneSearchTerm] = useState('');

  const codiceFiscaleValue = watch('codiceFiscale');
  const manualBirthData = watch('birthDate');
  const birthComune = watch('birthComune');

  useEffect(() => {
    if (
      useCodiceFiscale &&
      codiceFiscaleValue &&
      codiceFiscaleValue.length === 16 &&
      CodiceFiscale.check(codiceFiscaleValue.toUpperCase())
    ) {
      const data = CodiceFiscale.computeInverse(
        codiceFiscaleValue.toUpperCase(),
      );
      setUseCodiceFiscale(true);
      const birthDate = new ICalendarDate(
        data.year,
        data.month,
        data.day,
        // for some reason the types are not compatible
      ) as unknown as CalendarDate;
      console.log(
        'CF birthdate:',
        format(birthDate.toDate('UTC'), 'dd/MM/yyyy'),
        'birthplace:',
        data.birthplace,
      );
      setValue('birthDate', birthDate);
      setValue('birthComune', data.birthplace);
    }
  }, [codiceFiscaleValue, setValue, useCodiceFiscale]);

  const handleDateChange = useCallback(
    (date: DateValue | null) => {
      setValue('birthDate', date);
    },
    [setValue],
  );

  const handleComuneChange = useCallback(
    (key: React.Key | null) => {
      if (key) {
        setValue('birthComune', key as string);
      }
    },
    [setValue],
  );

  const handleComuneInputChange = useCallback((value: string) => {
    setComuneSearchTerm(value);
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
      }, 300); // Debounce the input

      return () => clearTimeout(timeoutId);
    } else {
      setComuneSuggestions([]);
    }
  }, [comuneSearchTerm]);

  const onSubmit = (data: FormData) => {
    console.log('Form Data:', data);
    // Here you would typically send the form data to your backend
  };

  return (
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
        errorMessage={errors.firstName?.message}
        isRequired
      />
      <Input
        label="Cognome"
        placeholder="Inserisci il tuo cognome"
        {...register('lastName', { required: 'Il cognome è obbligatorio' })}
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
        errorMessage={errors.email?.message}
        isRequired
      />
      <Input
        label="Password"
        placeholder="Inserisci la tua password"
        type="password"
        {...register('password', { required: 'La password è obbligatoria' })}
        errorMessage={errors.password?.message}
        isRequired
      />

      <div className="flex flex-col gap-3 w-full">
        <p className="text-gray-800 dark:text-gray-100">
          Hai un codice fiscale?
        </p>
        {/* two buttons 'si' 'no' displayed nicely */}
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
          {...register('codiceFiscale', {
            maxLength: {
              value: 16,
              message: 'Il codice fiscale deve essere di 16 caratteri',
            },
            minLength: {
              value: 16,
              message: 'Il codice fiscale deve essere di 16 caratteri',
            },
          })}
          errorMessage={errors.codiceFiscale?.message}
          maxLength={16}
          description="Inserisci il tuo codice fiscale per compilare automaticamente i dati di nascita."
        />
      )}
      <div className="space-y-5 w-full">
        <DatePicker
          label="Data di Nascita"
          onChange={handleDateChange}
          value={manualBirthData}
          description="Inserisci la tua data di nascita"
          isRequired
          labelPlacement="outside"
          isDisabled={useCodiceFiscale}
        />
        {useCodiceFiscale ? (
          <Input
            label="Comune di Nascita"
            placeholder="Il comune di nascita verrà auto-compilato"
            value={birthComune}
            errorMessage={errors.birthComune?.message}
            isRequired
            isDisabled
          />
        ) : (
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
            isDisabled={useCodiceFiscale}
          >
            {(item) => (
              <AutocompleteItem key={item.nome}>{item.nome}</AutocompleteItem>
            )}
          </Autocomplete>
        )}
      </div>

      <Button color="primary" type="submit" className="w-full">
        Registrati
      </Button>
    </Form>
  );
};

export default Signup;
