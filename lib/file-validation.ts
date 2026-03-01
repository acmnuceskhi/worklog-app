/**
 * File content validation via magic byte (file signature) inspection.
 *
 * More reliable than trusting client-provided MIME types, which can be
 * trivially spoofed. Each allowed MIME type is mapped to one or more
 * magic byte sequences that must appear at the start of the file.
 */

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47]], // \x89PNG
  "image/jpeg": [[0xff, 0xd8, 0xff]], // JFIF / Exif
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39], // GIF89a
  ],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

/**
 * Validate that a file's actual content matches the declared MIME type
 * by checking leading magic bytes.
 *
 * @param buffer  Raw file content (only the first 8 bytes are inspected)
 * @param declaredMimeType  The MIME type claimed by the client
 * @returns `true` if magic bytes match the declared type
 */
export function validateFileMagicBytes(
  buffer: ArrayBuffer,
  declaredMimeType: string,
): boolean {
  const signatures = MAGIC_BYTES[declaredMimeType];
  if (!signatures) return false;

  const bytes = new Uint8Array(buffer).slice(0, 8);

  return signatures.some((sig) => sig.every((byte, i) => bytes[i] === byte));
}

/** Maximum number of files allowed in a single upload request */
export const MAX_FILES_PER_UPLOAD = 5;
