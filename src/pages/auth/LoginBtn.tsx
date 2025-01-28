import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FaSignInAlt } from 'react-icons/fa';
import { Link } from 'react-router';

const LoginBtn = ({
  className,
  hideText,
  ...rest
}: ButtonProps & { hideText?: boolean }) => {
  const { t } = useTranslation();

  return (
    <Button
      as={Link}
      to="/auth/login"
      color="default"
      variant="bordered"
      className={className}
      {...rest}
    >
      <FaSignInAlt className={cn(className)} />
      {!hideText && (
        <span
          className={cn(
            { 'text-white': !className?.includes('text-') },
            'inline-block ml-2',
          )}
        >
          {t('home.login')}
        </span>
      )}
    </Button>
  );
};

export default LoginBtn;
