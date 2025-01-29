import { Image } from '@heroui/react';
import logo from '../../assets/images/logo.png';
import logoDark from '../../assets/images/logo-dark.png';
import { Link } from 'react-router';

const Logo = () => {
  return (
    <Link to="/">
      <Image
        src={logo}
        alt="Kinó Café"
        className="dark:hidden object-cover w-full h-full"
      />
      <Image
        src={logoDark}
        alt="Kinó Café"
        className="hidden dark:block object-cover w-full h-full"
      />
    </Link>
  );
};

export default Logo;
