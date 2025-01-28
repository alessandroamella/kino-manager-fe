import { BaseDocument } from './BaseDocument';
import { MembershipCard } from './MembershipCard';

export interface Member extends BaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  codiceFiscale: string | null;
  birthCountry: string;
  birthDate: Date;
  isAdmin: boolean;
  birthComune: string | null;
  birthProvince: string | null;
  gender: 'M' | 'F' | 'X';
  streetName: string | null;
  streetNumber: number | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  country: string | null; // ISO 3166-1 alpha-2
  memberSince: Date | null;
  phoneNumber: string;
  address: string;
  membershipCardNumber: MembershipCard['number'] | null;
}

export interface MemberWithToken extends Member {
  accessToken: string;
}
