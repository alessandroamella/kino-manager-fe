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
  name: string;
  province: string;
}

export interface ComuneFull extends Comune {
  cadastralCode: string;
  italianName?: string;
  foreignName?: string;
}
