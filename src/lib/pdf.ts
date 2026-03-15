export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString("base64");

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured");
  }

  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:application/pdf;base64,${base64}`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mistral OCR error:", errorText);
    throw new Error(`Mistral OCR failed: ${response.status}`);
  }

  const data = await response.json();

  // Mistral OCR returns pages with markdown content
  const text = data.pages
    ?.map((page: { markdown: string }) => page.markdown)
    .join("\n\n") ?? "";

  if (!text.trim()) {
    throw new Error("No text could be extracted from the PDF");
  }

  return text;
}
