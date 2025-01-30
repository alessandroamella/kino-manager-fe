export function toFixedItalian(n: number, digits = 2) {
  return n.toLocaleString('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
