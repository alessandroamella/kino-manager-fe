// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalize<T extends Record<string, any>>(obj: T): Partial<T> {
  const newObj: Partial<T> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      let value = obj[key];

      // Trim the value if it's a string
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Only include the key-value pair in the new object if the (trimmed) value is not an empty string
      if (!['', undefined].includes(value)) {
        newObj[key] = value;
      }
    }
  }

  return newObj;
}

export default normalize;
