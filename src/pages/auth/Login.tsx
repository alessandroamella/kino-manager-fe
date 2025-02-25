import { useEffect, useState } from 'react';
import { Form, Input, Button, Alert, Card } from '@heroui/react';
import { useForm } from 'react-hook-form';
import useUserStore from '../../store/user';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [search, setSearch] = useSearchParams();
  const defaultEmail = search.get('email');

  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      email:
        (defaultEmail &&
          ((search.delete('email'), setSearch(search)), defaultEmail)) ||
        '',
      password: '',
    },
  });
  const [alertError, setAlertError] = useState<string | null>(null);

  const login = useUserStore((store) => store.login);
  const error = useUserStore((store) => store.error);

  const navigate = useNavigate();

  const [successAlert, setSuccessAlert] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [alertTitle, alertDescription] = [
    search.get('title'),
    search.get('description'),
  ];
  useEffect(() => {
    if (alertTitle && alertDescription) {
      setSuccessAlert({ title: alertTitle, description: alertDescription });
      search.delete('title');
      search.delete('description');
      setSearch(search.toString());
    }
  }, [alertTitle, alertDescription, search, setSearch]);

  const errorSearch = search.get('error');
  useEffect(() => {
    if (errorSearch) {
      setAlertError(t(errorSearch));
      search.delete('error');
      setSearch(search.toString());
    }
  }, [errorSearch, search, setSearch, t]);

  const onSubmit = async (formData: FormData) => {
    setAlertError(null); // Clear previous error on new submit
    console.log('Login Form Data:', formData);
    const successful = await login(formData.email, formData.password);
    if (successful) {
      navigate(search.get('to') || '/profile');
    }
  };

  return (
    <>
      <PageTitle title="login" />
      <ScrollTop />
      <main className="py-12 mb-2 flex flex-col gap-4">
        <Card className="w-fit mx-auto">
          <Form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-lg md:min-w-[500px] mx-auto mt-2 md:mt-4 p-6 space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('login.title')}
            </h2>

            {alertError ? (
              <Alert
                color="danger"
                title={t('errors.error')}
                description={alertError}
                variant="faded"
              />
            ) : successAlert ? (
              <Alert
                color="success"
                title={t(successAlert.title)}
                description={t(successAlert.description)}
                variant="faded"
              />
            ) : null}

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
              isInvalid={
                !!(error === 'errors.auth.userNotFound' || errors.email)
              }
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
              isInvalid={
                !!(error === 'errors.auth.wrongPassword' || errors.password)
              }
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

          {[
            ['forgotPassword', 'forgot-password', 'resetPassword'],
            ['noAccount', 'signup', 'signup'],
          ].map(([k1, href, k2]) => (
            <div
              key={k1}
              className="flex flex-col gap-1 px-6 pb-4 items-center w-full"
            >
              <p className="text-foreground-600 text-small">
                {t(`signup.${k1}`)}
              </p>
              <Button
                as={Link}
                to={`/auth/${href}`}
                size="sm"
                type="button"
                variant="bordered"
                className="text-small w-full"
              >
                {t(`auth.${k2}`)}
              </Button>
            </div>
          ))}
        </Card>
      </main>
    </>
  );
};

export default Login;
