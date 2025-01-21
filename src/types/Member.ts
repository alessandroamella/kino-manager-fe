export enum VerificationMethod {
  CIE = 'CIE',
  MANUAL = 'MANUAL',
}

export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  codiceFiscale: string | null;
  birthCountry: string;
  birthDate: Date;
  birthProvince: string | null;
  verificationDate: Date | null;
  verificationMethod: VerificationMethod | null;
  createdAt: Date;
};
