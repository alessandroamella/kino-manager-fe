import { BaseDocument } from './BaseDocument';
import { MembershipCard } from './MembershipCard';
import { SubscriptionStatus } from './SubscriptionStatus';

export interface MemberExtended extends BaseDocument {
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
  signatureR2Key: string;
  phoneNumber: string;
  address: string;
  membershipCardNumber: MembershipCard['number'] | null;
  deviceInfo: {
    browser?: string;
    cpu?: string;
    device?: string;
    mobile?: boolean;
    os?: string;
  } | null;
  ipAddress: string | null;
  newsletterSubscriptionStatus: SubscriptionStatus;
}

export type Member = Pick<
  MemberExtended,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'codiceFiscale'
  | 'birthCountry'
  | 'birthDate'
  | 'isAdmin'
  | 'birthComune'
  | 'birthProvince'
  | 'gender'
  | 'memberSince'
  | 'signatureR2Key'
  | 'phoneNumber'
  | 'address'
  | 'membershipCardNumber'
>;

export interface MemberWithToken extends Member {
  accessToken: string;
}
