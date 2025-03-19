import type { TFunction } from 'i18next';
import PasswordValidator from 'password-validator';
import * as yup from 'yup';

export const passwordYupSchema = (t: TFunction, field = 'auth.password') =>
  yup
    .string()
    .required(t('errors.field.required', { field: t(field) }))
    .test('no-trim', t('errors.password.noLeadingTrailingSpaces'), (value) => {
      return value === value?.trim();
    })
    .test('password', t('signup.passwordDisclaimer'), (value) => {
      if (!value) return false;
      const schema = new PasswordValidator();
      schema
        .is()
        .min(8, t('errors.password.tooShort'))
        .has()
        .uppercase(1, t('errors.password.noUppercase'))
        .has()
        .lowercase(1, t('errors.password.noLowercase'))
        .has()
        .digits(1, t('errors.password.noDigit'));
      return !!schema.validate(value);
    });
