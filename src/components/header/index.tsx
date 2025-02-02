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
  Button,
} from '@heroui/react';
import {
  AiFillSetting,
  AiOutlineHome,
  AiOutlineLogout,
  AiOutlineUser,
} from 'react-icons/ai';
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
import { FaCashRegister } from 'react-icons/fa';
import { GiHamburger } from 'react-icons/gi';

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control menu open/close

  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const logout = useUserStore((store) => store.logout);

  const location = useLocation();

  function handleClickItem() {
    setIsMenuOpen(false); // Close the menu when an item is clicked
  }

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isBordered
      className="bg-gray-50 dark:bg-gray-900"
    >
      <NavbarContent>
        <NavbarMenuToggle aria-label="Toggle menu" className="sm:hidden" />

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
                <NavbarItem className="cursor-pointer mt-2 mr-2 min-w-20">
                  <UserData />
                </NavbarItem>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('header.userActions')}>
                <DropdownItem key="profile" textValue={t('header.profile')}>
                  <Link to="/profile" className="w-full inline-block">
                    <AiOutlineUser className="mr-2 inline-block" />
                    {t('header.profile')}
                  </Link>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  onPress={logout}
                  textValue={t('auth.logout')}
                >
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
          {user?.isAdmin && (
            <div className="flex items-center gap-1">
              <NavbarItem className="cursor-pointer">
                <Button
                  isDisabled={location.pathname.replace(/\//g, '') === 'admin'}
                  as={Link}
                  color="danger"
                  to="/admin"
                >
                  <AiFillSetting className="mr-2" />
                  {t('admin.adminPanelShort')}
                </Button>
              </NavbarItem>
              <NavbarItem className="cursor-pointer">
                <Button
                  isDisabled={
                    location.pathname.replace(/\//g, '') === 'cashier'
                  }
                  as={Link}
                  color="secondary"
                  to="/cashier"
                >
                  <FaCashRegister className="mr-2" />
                  {t('pages.cashier')}
                </Button>
              </NavbarItem>
              <NavbarItem className="cursor-pointer">
                <Button
                  isDisabled={
                    location.pathname.replace(/\//g, '') === 'cashier'
                  }
                  as={Link}
                  color="warning"
                  to="/menu"
                >
                  <GiHamburger className="mr-2" />
                  Menu
                </Button>
              </NavbarItem>
            </div>
          )}
        </NavbarContent>

        <NavbarMenu>
          {' '}
          {/* Use isMenuOpen to control NavbarMenu */}
          <NavbarMenuItem className="mt-4" isActive={location.pathname === '/'}>
            <Link to="/" onClick={handleClickItem}>
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
                <button
                  onClick={() => {
                    logout();
                    handleClickItem();
                  }}
                  className="w-full text-left"
                >
                  <AiOutlineLogout className="mr-2 inline-block" />
                  {t('auth.logout')}
                </button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem>
                <Skeleton isLoaded={!loading}>
                  <SignupBtn onPress={handleClickItem} className="w-full" />
                </Skeleton>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Skeleton isLoaded={!loading}>
                  <LoginBtn
                    onPress={handleClickItem}
                    variant="faded"
                    className="w-full text-foreground"
                  />
                </Skeleton>
              </NavbarMenuItem>
            </>
          )}
          <NavbarMenuItem className="mt-4">
            <ChangeLanguage className="w-full" />
          </NavbarMenuItem>
          <NavbarMenuItem>
            <ToggleTheme className="w-full" />
          </NavbarMenuItem>
          {user?.isAdmin && (
            <>
              <NavbarMenuItem className="cursor-pointer w-full">
                <Button
                  isDisabled={location.pathname.replace(/\//g, '') === 'admin'}
                  as={Link}
                  color="danger"
                  to="/admin"
                  className="w-full"
                  onClick={handleClickItem} // Optional: close menu after admin button click
                >
                  <AiFillSetting className="mr-2" />
                  {t('admin.adminPanelShort')}
                </Button>
              </NavbarMenuItem>
              <NavbarMenuItem className="cursor-pointer w-full">
                <Button
                  isDisabled={
                    location.pathname.replace(/\//g, '') === 'adminpurchases'
                  }
                  as={Link}
                  color="secondary"
                  to="/cashier"
                  className="w-full"
                  onPress={handleClickItem} // Optional: close menu after purchases button click
                >
                  <FaCashRegister className="mr-2" />
                  {t('pages.cashier')}
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </NavbarMenu>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
