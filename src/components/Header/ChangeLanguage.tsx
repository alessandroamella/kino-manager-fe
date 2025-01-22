import { useTranslation } from 'react-i18next';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { Key } from 'react';
import { CgChevronDown } from 'react-icons/cg';

function ChangeLanguage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: Key) => {
    i18n.changeLanguage(lng.toString());
  };

  return (
    <Dropdown>
      <DropdownTrigger>
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
}

export default ChangeLanguage;
