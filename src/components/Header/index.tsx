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
import { AiOutlineHome, AiOutlineLogout, AiOutlineUser } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo_small.png';
import logoDark from '../../assets/images/logo-dark.png';
import useUserStore from '../../store/user';
import { Link, useLocation } from 'react-router';
import ChangeLanguage from './ChangeLanguage';
import UserData from './UserData';
import LoginBtn from '../../pages/auth/LoginBtn';
import SignupBtn from '../../pages/auth/SignupBtn';
import ToggleTheme from './ToggleTheme';

const Header = () => {
  const { t } = useTranslation();

  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const logout = useUserStore((store) => store.logout);

  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleClickItem() {
    setIsMenuOpen(false);
    document.querySelector<HTMLButtonElement>('#menu-toggle')?.click();
    setTimeout(() => {
      setIsMenuOpen(false);
      document.querySelector<HTMLButtonElement>('#menu-toggle')?.click();
    }, 50);
  }

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
          id="menu-toggle"
        />

        <NavbarBrand as={Link} to="/">
          <Image
            src={logo}
            alt="logo"
            width="64"
            height="64"
            className="dark:hidden mr-2 p-1"
          />
          <Image
            src={logoDark}
            alt="logo"
            width="64"
            height="64"
            className="hidden dark:block mr-2 p-1"
          />
          <div className="flex flex-col">
            <p className="font-bold text-inherit text-xl">
              {t('common.title')}
            </p>
            <p className="text-small text-foreground-500 -mt-2">San Cesario</p>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end" className="hidden sm:flex">
          {/* Add other desktop NavbarItems here if needed, e.g., "Movies" or other features */}
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
                  <SignupBtn className="text-gray-800" />
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
          <ToggleTheme />
        </NavbarContent>

        <NavbarMenu className="gap-4">
          <NavbarMenuItem
            onClick={handleClickItem}
            className="mt-4"
            isActive={location.pathname === '/'}
          >
            <Link to="/">
              <AiOutlineHome className="mr-2 inline-block" />
              {t('header.home')}
            </Link>
          </NavbarMenuItem>
          {user ? (
            <>
              <NavbarMenuItem
                onClick={handleClickItem}
                isActive={location.pathname === '/profile'}
              >
                <Link to="/profile">
                  <AiOutlineUser className="mr-2 inline-block" />
                  {t('header.profile')}
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem onClick={handleClickItem}>
                <button onClick={logout} className="w-full text-left">
                  <AiOutlineLogout className="mr-2 inline-block" />
                  {t('auth.logout')}
                </button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem onClick={handleClickItem}>
                <Skeleton isLoaded={!loading}>
                  <SignupBtn className="w-full" />
                </Skeleton>
              </NavbarMenuItem>
              <NavbarMenuItem onClick={handleClickItem}>
                <Skeleton isLoaded={!loading}>
                  <LoginBtn variant="faded" className="w-full text-black" />
                </Skeleton>
              </NavbarMenuItem>
            </>
          )}
          <NavbarMenuItem onClick={handleClickItem} className="mt-4">
            <ChangeLanguage className="w-full" />
          </NavbarMenuItem>
          <NavbarMenuItem onClick={handleClickItem}>
            <ToggleTheme className="w-full" />
          </NavbarMenuItem>
        </NavbarMenu>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
