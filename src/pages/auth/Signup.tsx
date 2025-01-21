import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Autocomplete,
  AutocompleteItem,
  RadioGroup,
  Radio,
  DatePicker,
} from '@heroui/react';
import CodiceFiscale from 'codice-fiscale-js';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    codiceFiscale: '',
    birthDate: null as Date | null,
    birthComune: '',
    birthCountry: 'Italy',
  });
  const [useCodiceFiscale, setUseCodiceFiscale] = useState(false);
  const [comuneSuggestions, setComuneSuggestions] = useState([]);
  const [isComuneLoading, setIsComuneLoading] = useState(false);
  const [comuneSearchTerm, setComuneSearchTerm] = useState('');

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === 'codiceFiscale') {
        if (value.length === 16) {
          if (CodiceFiscale.check(value.toUpperCase())) {
            setUseCodiceFiscale(true);
            // Potentially auto-fill other fields based on CF here if needed
          } else {
            setFormData((prev) => ({
              ...prev,
              birthDate: null,
              birthComune: '',
            }));
            setUseCodiceFiscale(false);
          }
        } else if (value.length < 16 && useCodiceFiscale) {
          setFormData((prev) => ({
            ...prev,
            birthDate: null,
            birthComune: '',
          }));
          setUseCodiceFiscale(false);
        }
      }
    },
    [useCodiceFiscale],
  );

  //   const handleDateChange = (value: CalendarDate | null) => {
  //     if (!value) {
  //       return;
  //     }
  //     setFormData((prev) => ({
  //       ...prev,
  //       birthDate: new Date(value.year, value.month - 1, value.day),
  //     }));
  //   };

  const handleComuneChange = useCallback((key: React.Key | null) => {
    if (!key) {
      return;
    }
    setFormData((prev) => ({ ...prev, birthComune: key as string }));
  }, []);

  const handleComuneInputChange = useCallback((value: string) => {
    setComuneSearchTerm(value);
  }, []);

  useEffect(() => {
    if (comuneSearchTerm.length > 0) {
      setIsComuneLoading(true);
      const fetchComuni = async () => {
        try {
          const response = await fetch(
            `/v1/istat/comune?q=${comuneSearchTerm}`,
          );
          if (response.ok) {
            const data = await response.json();
            setComuneSuggestions(data);
          } else {
            console.error('Failed to fetch comuni:', response.status);
            setComuneSuggestions([]);
          }
        } catch (error) {
          console.error('Error fetching comuni:', error);
          setComuneSuggestions([]);
        } finally {
          setIsComuneLoading(false);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // Here you would typically send the form data to your backend
  };

  return (
    <Form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto mt-8 p-6 rounded-md shadow-md space-y-4"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Iscriviti al Nostro Caffè
      </h2>

      <Input
        label="Nome"
        placeholder="Inserisci il tuo nome"
        name="firstName"
        value={formData.firstName}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, firstName: value }))
        }
        isRequired
      />
      <Input
        label="Cognome"
        placeholder="Inserisci il tuo cognome"
        name="lastName"
        value={formData.lastName}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, lastName: value }))
        }
        isRequired
      />
      <Input
        label="Email"
        placeholder="Inserisci la tua email"
        name="email"
        type="email"
        value={formData.email}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, email: value }))
        }
        isRequired
      />
      <Input
        label="Password"
        placeholder="Inserisci la tua password"
        name="password"
        type="password"
        value={formData.password}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, password: value }))
        }
        isRequired
      />

      <RadioGroup
        label="Inserisci i dati di nascita"
        value={useCodiceFiscale ? 'codiceFiscale' : 'manuale'}
        onValueChange={(value) => {
          setUseCodiceFiscale(value === 'codiceFiscale');
          if (value === 'manuale') {
            setFormData((prev) => ({
              ...prev,
              birthDate: null,
              birthComune: '',
            }));
          }
        }}
      >
        <Radio value="codiceFiscale">Tramite Codice Fiscale</Radio>
        <Radio value="manuale">Manualmente</Radio>
      </RadioGroup>

      {useCodiceFiscale ? (
        <Input
          label="Codice Fiscale"
          placeholder="Inserisci il tuo codice fiscale"
          name="codiceFiscale"
          value={formData.codiceFiscale}
          onChange={handleInputChange}
          maxLength={16}
          description="Inserisci il tuo codice fiscale per compilare automaticamente i dati di nascita."
        />
      ) : (
        <div className="space-y-2">
          <DatePicker
            label="Data di Nascita"
            // onChange={handleDateChange}
            isRequired
            labelPlacement="outside"
          />
          {isComuneLoading && <p>Caricamento comuni...</p>}
          <Autocomplete
            label="Comune di Nascita"
            placeholder="Inizia a digitare il comune"
            items={comuneSuggestions}
            selectedKey={formData.birthComune}
            onSelectionChange={handleComuneChange}
            onInputChange={handleComuneInputChange}
            isRequired
            labelPlacement="outside"
            // loadingContent="Caricamento comuni..."
            // loadingState={isComuneLoading}
          >
            {(item) => <AutocompleteItem key={item}>{item}</AutocompleteItem>}
          </Autocomplete>
        </div>
      )}

      <Button color="primary" type="submit" className="w-full">
        Registrati
      </Button>
    </Form>
  );
};

export default Signup;
