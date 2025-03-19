import type { TFunction } from 'i18next';
import * as yup from 'yup';
import { signupYupSchema } from './signup';

export const loginYupSchema = (t: TFunction) =>
  yup.object({
    email: signupYupSchema(t, false).fields.email as yup.StringSchema<string>,
    password: signupYupSchema(t, false).fields
      .password as yup.StringSchema<string>,
  });
