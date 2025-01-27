import { BaseDocument } from './BaseDocument';
import { MembershipCard } from './MembershipCard';

export enum VerificationMethod {
  CIE = 'CIE',
  MANUAL = 'MANUAL',
}

export interface Member extends BaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  codiceFiscale: string | null;
  birthCountry: string;
  birthDate: Date;
  isAdmin: boolean;
  birthComune: string | null;
  verificationDate: Date | null;
  verificationMethod: VerificationMethod | null;
  phoneNumber: string;
  address: string;
  documentNumber: string | null;
  documentType: string | null;
  documentExpiry: Date | null;
  membershipCardNumber: MembershipCard['number'] | null;
}
