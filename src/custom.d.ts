declare module '@point-of-sale/receipt-printer-encoder' {
  interface PrinterModel {
    id: string;
    name: string;
  }

  interface ReceiptPrinterEncoderConstructorOptions {
    printerModel?: string;
    language?: 'esc-pos' | 'star-prnt' | 'star-line';
    columns?: number;
    feedBeforeCut?: number;
    newline?: string;
    imageMode?: 'column' | 'raster';
    codepageMapping?:
      | 'bixolon'
      | 'bixolon-legacy'
      | 'citizen'
      | 'epson-legacy'
      | 'epson'
      | 'fujitsu'
      | 'hp'
      | 'metapace'
      | 'mpt'
      | 'pos-5890'
      | 'pos-8360'
      | 'xprinter'
      | 'youku'
      | 'star'
      | Record<string, number>;
    codepageCandidates?: string[];
    createCanvas?: Canvas;
  }

  interface TableColumn {
    width: number;
    marginLeft?: number;
    marginRight?: number;
    align?: 'left' | 'right';
    verticalAlign?: 'top' | 'bottom';
  }

  type TableCellContent =
    | string
    | ((encoder: ReceiptPrinterEncoder) => ReceiptPrinterEncoder);
  type TableRow = TableCellContent[];
  type TableData = TableRow[];

  interface BoxOptions {
    style?: 'none' | 'single' | 'double';
    width?: number;
    marginLeft?: number;
    marginRight?: number;
    paddingLeft?: number;
    paddingRight?: number;
    align?: 'left' | 'right';
  }
  type BoxContent =
    | string
    | ((encoder: ReceiptPrinterEncoder) => ReceiptPrinterEncoder);

  interface RuleOptions {
    style?: 'single' | 'double';
    width?: number;
  }

  interface BarcodeOptions {
    height?: number;
    width?: number;
    text?: boolean;
  }

  interface QrcodeOptions {
    model?: 1 | 2;
    size?: number;
    errorlevel?: 'l' | 'm' | 'q' | 'h';
  }

  interface Pdf417Options {
    width?: number;
    height?: number;
    columns?: number;
    rows?: number;
    errorlevel?: number;
    truncated?: boolean;
  }

  type ImageSource =
    | ImageData
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | Canvas; // Representing 'Canvas' or 'Image' object from canvas, or raw pixel data buffers

  type DitheringAlgorithm =
    | 'threshold'
    | 'bayer'
    | 'floydsteinberg'
    | 'atkinson';

  export class ReceiptPrinterEncoder {
    static printerModels: PrinterModel[];

    constructor(options?: ReceiptPrinterEncoderConstructorOptions);

    initialize(): this;
    codepage(codepage: string): this;
    text(text: string): this;
    newline(lines?: number): this;
    newline(): this; // Overload for no argument case
    line(text: string): this;
    underline(enabled?: boolean): this;
    underline(): this; // Overload for no argument case
    bold(enabled?: boolean): this;
    bold(): this; // Overload for no argument case
    italic(enabled?: boolean): this;
    italic(): this; // Overload for no argument case
    invert(enabled?: boolean): this;
    invert(): this; // Overload for no argument case
    align(alignment: 'left' | 'center' | 'right'): this;
    font(font: 'A' | 'B' | 'C' | 'D' | 'E' | string): this; // Accepting font names or sizes like '9x17' '12x24'
    width(width: number): this;
    height(height: number): this;
    size(width: number, height: number): this;
    size(size: number): this;
    table(columnDefinitions: TableColumn[], data: TableData): this;
    box(options: BoxOptions, content: BoxContent): this;
    rule(options?: RuleOptions): this;
    barcode(
      data: string,
      symbology:
        | 'upca'
        | 'upce'
        | 'ean13'
        | 'ean8'
        | 'code39'
        | 'itf'
        | 'code93'
        | 'code128'
        | 'codabar'
        | 'gs1-128'
        | 'gs1-databar-omni'
        | 'gs1-databar-truncated'
        | 'gs1-databar-limited'
        | 'gs1-databar-expanded'
        | 'code128-auto',
      options?: BarcodeOptions,
    ): this;
    barcode(
      data: string,
      symbology:
        | 'upca'
        | 'upce'
        | 'ean13'
        | 'ean8'
        | 'code39'
        | 'itf'
        | 'code93'
        | 'code128'
        | 'codabar'
        | 'gs1-128'
        | 'gs1-databar-omni'
        | 'gs1-databar-truncated'
        | 'gs1-databar-limited'
        | 'gs1-databar-expanded'
        | 'code128-auto',
      height?: number,
    ): this; // Deprecated signature
    qrcode(data: string, options?: QrcodeOptions): this;
    qrcode(
      data: string,
      model?: number,
      size?: number,
      errorlevel?: string,
    ): this; // Deprecated signature
    pdf417(data: string, options?: Pdf417Options): this;
    image(
      image: ImageSource,
      width: number,
      height: number,
      algorithm?: DitheringAlgorithm,
      threshold?: number,
    ): this;
    image(
      image: ImageSource,
      width: number,
      height: number,
      algorithm?: DitheringAlgorithm,
    ): this;
    image(image: ImageSource, width: number, height: number): this;
    pulse(device?: 0 | 1, timeOn?: number, timeOff?: number): this;
    pulse(): this; // Overload for no argument case
    cut(type?: 'partial' | 'full'): this;
    cut(): this; // Overload for no argument case
    raw(commands: number[] | Uint8Array): this;

    encode(): Uint8Array;
  }
}
