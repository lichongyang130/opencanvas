declare module "pdf-parse" {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }
  function pdfParse(
    buffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PDFParseResult>;
  export default pdfParse;
}
