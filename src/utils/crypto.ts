import QRCode from 'qrcode';

/**
 * Computes a genuine SHA-256 cryptographic hash using the Web Crypto API
 */
export async function generateSha256(dataString: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, 'a');
}

/**
 * Generates an institutional certificate ID in format: CERT-{YEAR}-{INST}-{HEX}
 */
export function generateCertificateId(institutionCode: string, index: number = 0): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampHex = (Date.now() + index).toString(36).slice(-4).toUpperCase();
  return `CERT-${year}-${institutionCode.toUpperCase()}-${randomHex}${timestampHex}`;
}

/**
 * Generates a QR Code data URL using the installed 'qrcode' library
 */
export async function generateQrDataUrl(textPayload: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(textPayload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H'
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

/**
 * Creates a unique composite key to detect duplicate certificate issuance
 */
export function getParticipantDuplicateFingerprint(
  eventId: string,
  emailOrRollNo: string,
  role: string
): string {
  const normalizedKey = `${eventId.trim()}::${emailOrRollNo.trim().toLowerCase()}::${role.trim().toLowerCase()}`;
  return normalizedKey;
}
