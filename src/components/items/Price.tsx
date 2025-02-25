import { useTranslation } from 'react-i18next';

function formatPrice(
  price?: number,
  currencySymbol = '€',
  decimalDigits = 2,
  round = true,
  locale = 'en',
) {
  if (typeof price !== 'number') {
    return '-';
  }

  const actualDecimalDigits =
    round && Number.isInteger(price) ? 0 : decimalDigits;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: actualDecimalDigits,
    maximumFractionDigits: actualDecimalDigits,
  });

  return `${currencySymbol}${formatter.format(price)}`;
}

const Price = ({
  price,
  currencySymbol,
  decimalDigits,
  round,
}: {
  price?: number;
  currencySymbol?: string;
  decimalDigits?: number;
  round?: boolean;
}) => {
  const { i18n } = useTranslation();

  return formatPrice(
    price,
    currencySymbol,
    decimalDigits,
    round,
    i18n.language,
  );
};

Price.formatPrice = formatPrice;

export default Price;
