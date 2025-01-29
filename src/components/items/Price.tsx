function formatPrice(
  price?: number,
  currencySymbol = '€',
  decimalDigits = 2,
  round = true,
) {
  return typeof price === 'number'
    ? `${currencySymbol}${
        round && Number.isInteger(price) ? price : price.toFixed(decimalDigits)
      }`
    : '-';
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
  return formatPrice(price, currencySymbol, decimalDigits, round);
};

Price.formatPrice = formatPrice;

export default Price;
