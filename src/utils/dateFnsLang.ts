import { i18n } from 'i18next';
import { enUS, it } from 'date-fns/locale';

export function dateFnsLang(i18n: i18n) {
  return i18n.language === 'it' ? it : enUS;
}
