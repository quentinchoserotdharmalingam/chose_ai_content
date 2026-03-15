import { PDFParse } from "pdf-parse";

export async function extractTextFromPdfUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const parser = new PDFParse(buffer);
  const result = await parser.getText();
  return String(result);
}
