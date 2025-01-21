export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Provincia {
  nome: string;
  sigla: string;
  codice: string;
  regione: string;
}

export interface Comune {
  codice: string;
  nome: string;
  nomeStraniero?: string;
  codiceCatastale: string;
  cap: string;
  prefisso: string;
  provincia: Provincia;
  email?: string;
  pec?: string;
  telefono?: string;
  fax?: string;
  popolazione: number;
  coordinate: Coordinate;
}
