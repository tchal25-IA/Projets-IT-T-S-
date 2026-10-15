/**
 * Sanitize object to prevent prototype pollution from untrusted sources
 * Removes __proto__, constructor, and prototype properties recursively
 */
export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block dangerous prototype pollution vectors
    if (
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype"
    ) {
      continue;
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Validate file before processing to prevent malicious uploads
 */
export function validateImportFile(file: File): { ok: boolean; error?: string } {
  // Size limit: 2 MB
  const MAX_BYTES = 2 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (max. 2 Mo)" };
  }

  // File type whitelist
  const name = file.name.toLowerCase();
  const allowedExtensions = [".csv", ".xlsx", ".xls"];
  const hasValidExtension = allowedExtensions.some((ext) => name.endsWith(ext));
  
  if (!hasValidExtension) {
    return { ok: false, error: "Format non supporté (CSV ou Excel uniquement)" };
  }

  // Check MIME type if available (can be spoofed but adds defense in depth)
  const allowedMimes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream", // Some browsers use this for Excel files
  ];
  
  if (file.type && !allowedMimes.includes(file.type)) {
    return { ok: false, error: "Type MIME non autorisé" };
  }

  return { ok: true };
}

/**
 * Validate and sanitize a single row from import
 * Returns null if row should be skipped
 */
export function validateImportRow(
  row: unknown
): { companyName: string; data: Record<string, string> } | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const sanitized = sanitizeObject(row) as Record<string, unknown>;
  
  // Extract company name with fallbacks
  const companyName =
    String(sanitized.companyName || sanitized.entreprise || sanitized.societe || sanitized.company || sanitized.nom || "").trim();

  if (!companyName) {
    return null;
  }

  // Convert all values to strings and sanitize
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string" || typeof value === "number") {
      // Limit field length to prevent DOS
      const stringValue = String(value).slice(0, 1000);
      data[key] = stringValue;
    }
  }

  return { companyName, data };
}
