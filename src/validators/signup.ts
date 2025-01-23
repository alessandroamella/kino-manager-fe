import * as yup from 'yup';
import { TFunction } from 'i18next';
import CodiceFiscale from 'codice-fiscale-js';
import { passwordYupSchema } from './password';

// Signup Yup Schema
export const signupYupSchema = (t: TFunction) =>
  yup.object().shape({
    firstName: yup
      .string()
      .required(t('errors.firstName.required'))
      .min(1, t('errors.firstName.tooShort'))
      .max(50, t('errors.firstName.tooLong')),
    lastName: yup
      .string()
      .required(t('errors.lastName.required'))
      .min(1, t('errors.lastName.tooShort'))
      .max(50, t('errors.lastName.tooLong')),
    email: yup
      .string()
      .required(t('errors.email.required'))
      .email(t('errors.email.invalid')),
    password: passwordYupSchema(t, 'auth.password'),
    codiceFiscale: yup
      .string()
      .nullable() // Allow null values
      .notRequired() // Make it optional in the schema
      .transform((value) => (value === '' ? null : value)) // Treat empty string as null for optional field
      .test(
        'codiceFiscale',
        t('errors.codiceFiscale.invalid'),
        (value, context) => {
          const useCodiceFiscale = context.options.context?.useCodiceFiscale;
          if (!useCodiceFiscale || !value) {
            return true; // Skip validation if not using CF or no value
          }
          if (
            typeof value !== 'string' ||
            value.length !== 16 ||
            !CodiceFiscale.check(value.toUpperCase())
          ) {
            return false;
          }
          return true;
        },
      ),
    birthCountry: yup
      .string()
      .required(t('errors.birthCountry.required'))
      .length(2, t('errors.birthCountry.invalid')), // Assuming ISO Alpha-2 is always 2 chars
    birthComune: yup
      .string()
      .nullable()
      .notRequired()
      .min(1, t('errors.birthComune.tooShort'))
      .max(255, t('errors.birthComune.tooLong')),
    birthDate: yup.date().required(t('errors.birthDate.required')),
    address: yup.string().min(1, t('errors.address.required')),
  });
