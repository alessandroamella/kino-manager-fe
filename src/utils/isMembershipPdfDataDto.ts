import { MemberExtended } from '@/types/Member';
import { MembershipPdfData } from '@/types/MembershipPdfData';
import { isValid } from 'date-fns';

export function isMembershipPdfDataDto(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _obj: any,
): _obj is MembershipPdfData {
  const obj = _obj as MemberExtended;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.email === 'string' &&
    isValid(new Date(obj.birthDate)) &&
    typeof obj.birthComune === 'string' &&
    typeof obj.streetName === 'string' &&
    typeof obj.streetNumber === 'string' &&
    typeof obj.postalCode === 'string' &&
    typeof obj.city === 'string' &&
    typeof obj.province === 'string' &&
    typeof obj.phoneNumber === 'string' &&
    typeof obj.country === 'string' &&
    typeof obj.codiceFiscale === 'string' &&
    typeof obj.birthProvince === 'string' &&
    !!obj.memberSince &&
    isValid(new Date(obj.memberSince)) &&
    typeof obj.membershipCardNumber === 'number' &&
    obj.signatureR2Key !== ''
  );
}
