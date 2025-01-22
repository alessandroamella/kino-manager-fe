import { Button, ButtonProps } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router';

const SignupBtn = ({ className, ...rest }: ButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      as={Link}
      to="/auth/signup"
      color="secondary"
      className={className}
      {...rest}
    >
      <FaUserPlus className="mr-2 hidden sm:inline-block" />
      {t('home.signup')}
    </Button>
  );
};

export default SignupBtn;
