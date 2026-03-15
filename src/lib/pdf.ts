import { PDFParse } from "pdf-parse";
import { readFile } from "fs/promises";

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const parser = new PDFParse(buffer);
  const result = await parser.getText();
  return String(result);
}
