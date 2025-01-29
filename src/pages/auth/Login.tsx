import { useState } from 'react';
import { Form, Input, Button, Alert, Card } from '@heroui/react';
import { useForm } from 'react-hook-form';
import useUserStore from '../../store/user';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import PageTitle from '@/components/PageTitle';
import ScrollTop from '@/components/ScrollTop';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onBlur',
  });
  const [loginError, setLoginError] = useState<string | null>(null); // State for login error

  const login = useUserStore((store) => store.login);
  const error = useUserStore((store) => store.error);

  const navigate = useNavigate();

  const [search] = useSearchParams();

  const onSubmit = async (formData: FormData) => {
    setLoginError(null); // Clear previous error on new submit
    console.log('Login Form Data:', formData);
    const successful = await login(formData.email, formData.password);
    if (successful) {
      navigate(search.get('to') || '/profile');
    }
  };

  const { t } = useTranslation();

  return (
    <>
      <PageTitle title="login" />
      <ScrollTop />
      <main className="py-12 mb-2 flex flex-col gap-4">
        {loginError && (
          <Alert
            color="danger"
            title={t('errors.error')}
            description={loginError}
            variant="faded"
          />
        )}
        <Card className="w-fit mx-auto">
          <Form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-lg md:min-w-[500px] mx-auto mt-2 md:mt-4 p-6 space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {t('login.title')}
            </h2>

            <Input
              label={t('signup.email')}
              placeholder={t('signup.emailPlaceholder')}
              type="email"
              {...register('email', {
                required: t('errors.field.required', {
                  field: t('profile.lastName'),
                }),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('errors.field.invalid', {
                    field: t('signup.email'),
                  }),
                },
              })}
              isInvalid={Boolean(
                error === 'errors.auth.userNotFound' || errors.email,
              )}
              errorMessage={error ? t(error) : errors.email?.message}
              isRequired
            />
            <Input
              label={t('auth.password')}
              placeholder={t('signup.passwordPlaceholder')}
              type="password"
              {...register('password', {
                required: t('errors.field.required', {
                  field: t('auth.password'),
                }),
              })}
              isInvalid={Boolean(
                error === 'errors.auth.wrongPassword' || errors.password,
              )}
              errorMessage={error ? t(error) : errors.password?.message}
              isRequired
            />

            <Button
              color="primary"
              type="submit"
              className="w-full"
              isDisabled={!isValid}
            >
              {t('auth.login')}
            </Button>
          </Form>
        </Card>
      </main>
    </>
  );
};

export default Login;
