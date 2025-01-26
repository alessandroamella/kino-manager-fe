import * as yup from 'yup';
import { TFunction } from 'i18next';
import { signupYupSchema } from './signup';

export const adminEditUserYupSchema = (t: TFunction) =>
  signupYupSchema(t, false).shape({
    password: yup.string().nullable().notRequired(),
    documentNumber: yup.string().notRequired().nullable(),
    documentType: yup
      .string()
      .notRequired()
      .nullable()
      .oneOf(
        ['CIE', 'PASSPORT', 'DRIVING_LICENSE', 'OTHER'],
        t('errors.field.invalid', { field: t('profile.documentType') }),
      ),
    documentExpiry: yup.date().notRequired().nullable(),
    membershipCardNumber: yup.string().notRequired().nullable(),
  });
