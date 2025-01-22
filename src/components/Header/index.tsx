import { useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  NavbarMenuToggle,
  Image,
  Skeleton,
} from '@heroui/react';
import { AiOutlineLogout, AiOutlineUser } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/IMG_20200724_125212.jpg';
import useUserStore from '../../store/user';
import { Link } from 'react-router';
import ChangeLanguage from './ChangeLanguage';
import UserData from './UserData';
import LoginBtn from '../../pages/auth/LoginBtn';
import SignupBtn from '../../pages/auth/SignupBtn';

const Header = () => {
  const { t } = useTranslation();

  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const logout = useUserStore((store) => store.logout);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar
      isBordered
      className="bg-gray-50 dark:bg-gray-900"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />

        <NavbarBrand as={Link} to="/">
          <Image
            src={logo}
            alt="logo"
            width="50"
            height="50"
            className="mr-2"
          />
          <p className="font-bold text-inherit text-xl">{t('common.title')}</p>
        </NavbarBrand>

        <NavbarMenu>
          <NavbarMenuItem>
            <a href="#">{t('header.home')}</a>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <a href="#">{t('header.movies')}</a>
          </NavbarMenuItem>
        </NavbarMenu>

        <NavbarContent justify="end" className="hidden sm:flex">
          {user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <NavbarItem className="cursor-pointer mt-2">
                  <UserData />
                </NavbarItem>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('header.userActions')}>
                <DropdownItem key="profile">
                  <Link to="/profile" className="w-full inline-block">
                    <AiOutlineUser className="mr-2 inline-block" />
                    {t('header.profile')}
                  </Link>
                </DropdownItem>
                <DropdownItem key="logout" onPress={logout}>
                  <AiOutlineLogout className="mr-2 inline-block" />
                  {t('auth.logout')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex gap-2 items-center">
              <NavbarItem>
                <Skeleton isLoaded={!loading}>
                  <SignupBtn className="h-9" />
                </Skeleton>
              </NavbarItem>
              <NavbarItem>
                <Skeleton isLoaded={!loading}>
                  <LoginBtn hideText />
                </Skeleton>
              </NavbarItem>
            </div>
          )}
          <ChangeLanguage />
        </NavbarContent>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
