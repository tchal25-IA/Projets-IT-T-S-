export async function verifyJwt<T = Record<string, unknown>>(
  token: string,
  secret: string,
): Promise<T | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;

  function b64urlDecode(s: string): Uint8Array {
    let b = s.replace(/-/g, "+").replace(/_/g, "/");
    b += "=".repeat(b.length % 4 ? 4 - (b.length % 4) : 0);
    const bin = atob(b);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(sig) as BufferSource,
    new TextEncoder().encode(`${header}.${body}`) as BufferSource,
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(body)),
    ) as T & { exp?: number; aud?: string };
    if ((payload as { aud?: string }).aud !== "finzy") return null;
    if (
      typeof (payload as { exp?: number }).exp === "number" &&
      (payload as { exp: number }).exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
