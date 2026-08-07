/** Génère un PDF minimal (PDF 1.4) sans dépendance native. */
export function buildSimplePdf(lines: string[]): Buffer {
  const contentLines = lines.flatMap((line, i) => {
    const y = 800 - i * 16;
    const safe = line.replace(/[()\\]/g, "\\$&").slice(0, 110);
    return [`BT /F1 11 Tf 50 ${y} Td (${safe}) Tj ET`];
  });
  const stream = contentLines.join("\n");
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj"
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream endobj`
  );
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj + "\n";
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export function dealLinesToPdfLines(opts: {
  title: string;
  company: string;
  invoiceNumber?: string | null;
  lines: { label: string; amountHt: number; billingStatus: string }[];
}): string[] {
  const total = opts.lines.reduce((s, l) => s + l.amountHt, 0);
  const out = [
    "T&S CRM — Document commercial",
    opts.title,
    `Client: ${opts.company}`,
    opts.invoiceNumber ? `N: ${opts.invoiceNumber}` : `Date: ${new Date().toLocaleDateString("fr-FR")}`,
    "----------------------------------------",
    ...opts.lines.map(
      (l) =>
        `${l.label} — ${l.amountHt.toFixed(2)} EUR HT [${l.billingStatus}]`
    ),
    "----------------------------------------",
    `Total HT: ${total.toFixed(2)} EUR`,
  ];
  return out;
}
