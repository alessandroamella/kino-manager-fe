import type { TFunction } from 'i18next';
import { passwordYupSchema } from './password';
import * as yup from 'yup';

export const resetPasswordYupSchema = (t: TFunction) =>
  yup.object().shape({
    password: passwordYupSchema(t, 'auth.password'),
  });
