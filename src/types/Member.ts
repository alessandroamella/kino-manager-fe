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
  memberSince: Date | null;
  phoneNumber: string;
  address: string;
  membershipCardNumber: MembershipCard['number'] | null;
}

export interface MemberWithToken extends Member {
  accessToken: string;
}
