import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import { getErrorMsg } from '@/types/error';
import { Alert, Button, Card, Form, Input } from '@heroui/react';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

type FormData = {
  email: string;
};

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onBlur',
  });
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation();

  const onSubmit = async (formData: FormData) => {
    setResetError(null);
    setResetSuccess(false);
    setLoading(true);

    try {
      await axios.post('/v1/auth/forgot-password', formData);
      setResetSuccess(true);
    } catch (error) {
      console.error('Forgot password Error:', error);
      setResetError(getErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="forgotPassword" />
      <ScrollTop />
      <main className="py-12 mb-2 flex flex-col gap-4">
        <Card className="w-fit mx-auto">
          <Form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-lg md:min-w-[500px] mx-auto mt-2 md:mt-4 p-6 space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('forgotPassword.title')}
            </h2>

            {resetError ? (
              <Alert
                color="danger"
                title={t('errors.error')}
                description={resetError}
                variant="faded"
                onClose={() => setResetError(null)}
              />
            ) : resetSuccess ? (
              <Alert
                color="success"
                title={t('forgotPassword.successTitle')}
                description={t('forgotPassword.successDescription')}
                variant="faded"
              />
            ) : null}

            <p className="text-foreground-600 text-small">
              {t('forgotPassword.description')}
            </p>

            <Input
              label={t('signup.email')}
              placeholder={t('signup.emailPlaceholder')}
              type="email"
              {...register('email', {
                required: t('errors.field.required', {
                  field: t('signup.email'),
                }),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('errors.field.invalid', {
                    field: t('signup.email'),
                  }),
                },
              })}
              isInvalid={!!errors.email}
              isDisabled={loading || resetSuccess}
              errorMessage={errors.email?.message}
              isRequired
            />

            <Button
              color="primary"
              type="submit"
              className="w-full"
              isDisabled={!isValid || loading || resetSuccess}
              isLoading={loading}
            >
              {t('forgotPassword.submit')}
            </Button>
          </Form>

          <div className="flex flex-col gap-1 px-6 pb-4 items-center w-full">
            <p className="text-foreground-600 text-small">
              {t('forgotPassword.backToLogin')}
            </p>
            <Button
              as={Link}
              to="/auth/login"
              size="sm"
              type="button"
              variant="bordered"
              className="text-small w-full"
            >
              {t('auth.login')}
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
};

export default ForgotPassword;
