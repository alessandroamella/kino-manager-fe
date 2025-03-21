import PageTitle from '@/components/navigation/PageTitle';
import ScrollTop from '@/components/navigation/ScrollTop';
import { getErrorMsg } from '@/types/error';
import { resetPasswordYupSchema } from '@/validators/reset-password';
import { Alert, Button, Card, Form, Input } from '@heroui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router';

type FormData = {
  password: string;
};

const ResetPassword = () => {
  const [search] = useSearchParams();
  const token = search.get('token');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      navigate({
        pathname: '/auth/login',
        search: createSearchParams({
          error: 'errors.auth.noTokenProvided',
        }).toString(),
      });
      return;
    }
  }, [navigate, t, token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
  } = useForm<FormData>({
    mode: 'onChange',
    resolver: yupResolver(resetPasswordYupSchema(t)),
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async ({ password }: FormData) => {
    setResetError(null);
    setResetSuccess(false);
    setLoading(true);

    try {
      const { data } = await axios.post<{ email: string }>(
        '/v1/auth/reset-password',
        { token, password },
      );
      navigate({
        pathname: '/auth/login',
        search: createSearchParams({
          title: 'resetPassword.successTitle',
          description: 'resetPassword.successDescription',
          email: data.email,
        }).toString(),
      });
    } catch (error) {
      console.error('Reset Password Error:', error);
      setResetError(getErrorMsg(error));
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="resetPassword" />
      <ScrollTop />
      <main className="py-12 mb-2 flex flex-col gap-4">
        <Card className="w-fit mx-auto">
          <Form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-lg md:min-w-[500px] mx-auto mt-2 md:mt-4 p-6 space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('resetPassword.title')}
            </h2>
            {resetError && (
              <Alert
                color="danger"
                title={t('errors.error')}
                description={resetError}
                variant="faded"
                onClose={() => setResetError(null)}
              />
            )}
            {resetSuccess && (
              <Alert
                color="success"
                title={t('resetPassword.successTitle')}
                description={t('resetPassword.successDescription')}
                variant="faded"
              />
            )}

            <p className="text-foreground-600 text-small">
              {t('resetPassword.description')}
            </p>

            <Input
              label={t('resetPassword.newPassword')}
              placeholder={t('signup.passwordPlaceholder')}
              type="password"
              autoComplete="new-password"
              {...register('password')}
              isInvalid={!!errors.password}
              onValueChange={(e) => e.length > 8 && trigger('password')}
              errorMessage={errors.password?.message}
              isRequired
            />

            <Button
              color="primary"
              type="submit"
              className="w-full"
              isDisabled={!isValid || loading}
              isLoading={loading}
            >
              {t('resetPassword.submit')}
            </Button>
          </Form>

          {resetSuccess && (
            <div className="flex flex-col gap-1 px-6 pb-4 items-center w-full">
              <p className="text-foreground-600 text-small">
                {t('resetPassword.backToLoginPrompt')}
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
          )}
        </Card>
      </main>
    </>
  );
};

export default ResetPassword;
