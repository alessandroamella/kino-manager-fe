export async function sha256(string: string) {
  // check if crypto API is available
  if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') {
    throw new Error('Crypto API is not available');
  }

  const utf8 = new TextEncoder().encode(string);
  return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  });
}
