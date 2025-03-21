import { Member } from './Member';

export interface MembershipPdfData
  extends Pick<
    Member,
    'firstName' | 'lastName' | 'email' | 'birthDate' | 'phoneNumber'
  > {
  birthComune: string;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  codiceFiscale: string;
  birthProvince: string;
  memberSince: Date;
  membershipCardNumber: number;
}
