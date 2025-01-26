import { Button, ButtonProps } from '@heroui/react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router';
import ReactGA from 'react-ga4';

const SignupBtn = ({ className, onPress, ...rest }: ButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      as={Link}
      to="/auth/signup"
      color="primary"
      className={classNames(className, 'font-semibold')}
      onPress={(e) => {
        ReactGA.event({
          category: 'User',
          action: 'Clicked Signup Button',
        });
        onPress?.(e);
      }}
      {...rest}
    >
      <FaUserPlus className="mr-2" />
      {t('home.signup')}
    </Button>
  );
};

export default SignupBtn;
