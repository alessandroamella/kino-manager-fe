import * as yup from 'yup';
import type { TFunction } from 'i18next';
import CodiceFiscale from 'codice-fiscale-js';
import { passwordYupSchema } from './password';
import parsePhoneNumber from 'libphonenumber-js';

export const signupYupSchema = (t: TFunction, useCodiceFiscale: boolean) =>
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
            return false;
          }
          try {
            return !!value && parsePhoneNumber(value, 'IT')?.isValid();
          } catch (error) {
            console.error('Phone number parsing error:', error);
            return false;
          }
        },
      ),
    password: passwordYupSchema(t, 'auth.password'),
    codiceFiscale: yup
      .string()
      .notRequired()
      .nullable()
      .trim()
      .uppercase()
      .test('codiceFiscale', t('signup.cfInvalid'), (value) => {
        if (!useCodiceFiscale) {
          return true;
        }
        if (
          typeof value !== 'string' ||
          value.length !== 16 ||
          !CodiceFiscale.check(value)
        ) {
          return false;
        }
        return true;
      }),
    birthCountry: yup
      .string()
      .required(
        t('errors.field.required', { field: t('profile.birthCountry') }),
      )
      .length(
        2,
        t('errors.field.invalid', { field: t('profile.birthCountry') }),
      ),
    birthComune: yup
      .string()
      .notRequired()
      .nullable()
      .min(1, t('errors.field.tooShort', { field: t('profile.birthComune') }))
      .max(255, t('errors.field.tooLong', { field: t('profile.birthComune') })),
    birthProvince: yup
      .string()
      .notRequired()
      .nullable()
      .min(2, t('errors.field.tooShort', { field: t('profile.birthProvince') }))
      .max(2, t('errors.field.tooLong', { field: t('profile.birthProvince') })),
    gender: yup
      .string()
      .notRequired()
      .nullable()
      .oneOf(
        ['M', 'F', 'X'],
        t('errors.field.invalid', { field: t('profile.gender') }),
      ),
    birthDate: yup
      .date()
      .required(t('errors.field.required', { field: t('profile.birthDate') })),
    address: yup
      .string()
      .min(1, t('errors.field.required', { field: t('profile.address') })),
    streetName: yup.string().notRequired().nullable().min(1).max(255),
    streetNumber: yup
      .number()
      .integer()
      .notRequired()
      .nullable()
      .min(1)
      .max(99999),
    postalCode: yup
      .string()
      .notRequired()
      .nullable()
      .length(5, t('errors.field.invalid')),
    city: yup.string().notRequired().nullable().min(1).max(255),
    province: yup.string().notRequired().nullable().min(2).max(2),
    country: yup.string().notRequired().nullable().min(2).max(2),
    signatureB64: yup
      .string()
      .required(t('errors.field.required', { field: t('signup.signature') })),
    acceptTerms: yup.boolean().oneOf([true], t('errors.terms.accept')),
  });
