import { Button, ButtonProps } from '@heroui/react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router';

const SignupBtn = ({ className, ...rest }: ButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      as={Link}
      to="/auth/signup"
      color="primary"
      className={classNames(className, 'font-semibold')}
      {...rest}
    >
      <FaUserPlus className="mr-2" />
      {t('home.signup')}
    </Button>
  );
};

export default SignupBtn;
