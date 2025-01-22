import { useEffect, useState } from 'react';
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
  // Avatar,
  Button,
  NavbarMenuToggle,
  Image,
  User,
  Skeleton,
} from '@heroui/react';
import { AiOutlineLogout, AiOutlineUser } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';
import logo from '../assets/IMG_20200724_125212.jpg';
import useUserStore from '../store/user';
import { sha256 } from '../shared/sha256';
import { Link } from 'react-router';

const Header = () => {
  const { t } = useTranslation();

  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const logout = useUserStore((store) => store.logout);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [gravatarEmail, setGravatarEmail] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      sha256(user.email).then(setGravatarEmail).catch(console.error);
    }
  }, [user]);

  return (
    <Navbar
      isBordered
      className="dark:bg-gray-900"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />

        <NavbarBrand>
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
                <NavbarItem>
                  <User
                    name={user.firstName}
                    description={
                      user.verificationDate ? 'Verified' : 'Not verified'
                    }
                    avatarProps={
                      gravatarEmail
                        ? {
                            src: gravatarEmail,
                          }
                        : undefined
                    }
                  />
                </NavbarItem>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('header.userActions')}>
                <DropdownItem key="profile">
                  <AiOutlineUser className="mr-2 inline-block" />
                  {t('header.profile')}
                </DropdownItem>
                <DropdownItem key="logout" onPress={logout}>
                  <AiOutlineLogout className="mr-2 inline-block" />
                  {t('auth.logout')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <>
              <NavbarItem>
                <Skeleton isLoaded={!loading}>
                  <Button
                    as={Link}
                    color="primary"
                    to="/auth/login"
                    variant="flat"
                  >
                    {t('auth.login')}
                  </Button>
                </Skeleton>
              </NavbarItem>
              <NavbarItem>
                <Skeleton isLoaded={!loading}>
                  <Button as={Link} color="primary" to="/auth/signup">
                    {t('auth.signup')}
                  </Button>
                </Skeleton>
              </NavbarItem>
            </>
          )}
        </NavbarContent>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
