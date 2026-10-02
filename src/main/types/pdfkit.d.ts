// src/main/types/pdfkit.d.ts
declare module 'pdfkit' {
  export default class PDFDocument {
    constructor(options?: any);
    text(text: string, options?: any): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): void;
    font(fontName: string): void;
    fontSize(size: number): void;
    end(): void;
    on(event: string, listener: (...args: any[]) => void): void;
    moveDown(): void;
  }
}