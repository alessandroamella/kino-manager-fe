export const tryStoi = (value: unknown): number | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const val = parseInt(value, 10);
  if (isNaN(val)) {
    return null;
  }
  return val;
};
