import { useTranslation } from 'react-i18next';

function formatPrice(
  locale: string,
  price: number,
  decimalDigits?: number,
  round?: boolean,
  currencySymbol = '€',
) {
  if (typeof price !== 'number') {
    return '-';
  }

  const actualDecimalDigits = round ? 0 : decimalDigits ?? 2;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: actualDecimalDigits,
    maximumFractionDigits: actualDecimalDigits,
  });

  return `${price < 0 ? '-' : ''}${currencySymbol}${formatter.format(
    Math.abs(price),
  )}`;
}

const Price = ({
  price,
  currencySymbol,
  decimalDigits,
  round,
}: {
  price: number;
  currencySymbol?: string;
  decimalDigits?: number;
  round?: boolean;
}) => {
  const { i18n } = useTranslation();

  return formatPrice(
    i18n.language,
    price,
    decimalDigits,
    round,
    currencySymbol,
  );
};

Price.formatPrice = formatPrice;

export default Price;
