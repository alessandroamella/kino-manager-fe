import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownProps,
  DropdownTrigger,
} from '@heroui/react';
import { Key } from 'react';
import { useTranslation } from 'react-i18next';
import { CgChevronDown } from 'react-icons/cg';

const ChangeLanguage = ({
  className,
  ...rest
}: Omit<DropdownProps, 'children'>) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: Key) => {
    i18n.changeLanguage(lng.toString());
  };

  return (
    <Dropdown className={className} {...rest}>
      <DropdownTrigger className={className}>
        <Button variant="bordered" endContent={<CgChevronDown />}>
          {t('languages.' + i18n.language.toLowerCase())}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Select Language" onAction={changeLanguage}>
        <DropdownItem key="en">English</DropdownItem>
        <DropdownItem key="it">Italiano</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default ChangeLanguage;
