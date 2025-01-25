// validators/signup.ts
import * as yup from 'yup';
import { TFunction } from 'i18next';
import CodiceFiscale from 'codice-fiscale-js';
import { passwordYupSchema } from './password';
import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';

// Signup Yup Schema
export const signupYupSchema = (t: TFunction) =>
  yup.object().shape({
    firstName: yup
      .string()
      .required(t('errors.field.required', { field: t('profile.firstName') }))
      .min(1, t('errors.field.tooShort', { field: t('profile.firstName') }))
      .max(50, t('errors.field.tooLong', { field: t('profile.firstName') })),
    lastName: yup
      .string()
      .required(t('errors.field.required', { field: t('profile.lastName') }))
      .min(1, t('errors.field.tooShort', { field: t('profile.lastName') }))
      .max(50, t('errors.field.tooLong', { field: t('profile.lastName') })),
    email: yup
      .string()
      .required(t('errors.field.required', { field: t('profile.email') }))
      .email(t('errors.field.invalid', { field: t('profile.email') })),
    phoneNumber: yup
      .string()
      .required(t('errors.field.required', { field: t('profile.phoneNumber') }))
      .test(
        'phoneNumber',
        t('errors.field.invalid', { field: t('profile.phoneNumber') }),
        (value) => {
          if (!value) {
            return false; // Required already handles this, but for safety
          }
          try {
            const phoneNumber = parsePhoneNumber(value, 'IT'); // Default to Italian numbers
            return phoneNumber && isValidPhoneNumber(phoneNumber.number);
          } catch (error) {
            console.error('Phone number parsing error:', error);
            return false; // Parsing error, invalid phone number
          }
        },
      ),
    password: passwordYupSchema(t, 'auth.password'),
    codiceFiscale: yup
      .string()
      .nullable() // Allow null values
      .notRequired() // Make it optional in the schema
      .test(
        'codiceFiscale',
        t('errors.field.invalid', { field: t('profile.codiceFiscale') }),
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
      .required(
        t('errors.field.required', { field: t('profile.birthCountry') }),
      )
      .length(
        2,
        t('errors.field.invalid', { field: t('profile.birthCountry') }),
      ), // Assuming ISO Alpha-2 is always 2 chars
    birthComune: yup
      .string()
      .nullable()
      .notRequired()
      .min(1, t('errors.field.tooShort', { field: t('profile.birthComune') }))
      .max(255, t('errors.field.tooLong', { field: t('profile.birthComune') })),
    birthDate: yup
      .date()
      .required(t('errors.field.required', { field: t('profile.birthDate') })),
    address: yup
      .string()
      .min(1, t('errors.field.required', { field: t('profile.address') })),
  });
