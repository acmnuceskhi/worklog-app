import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { uploadLimiter } from "@/lib/rate-limit";
import {
  validateFileMagicBytes,
  MAX_FILES_PER_UPLOAD,
} from "@/lib/file-validation";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = await getRateLimitIdentifier();
    const rateLimitResponse = checkRateLimit(uploadLimiter, 10, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const formData = await request.formData();
    const fileEntries = formData.getAll("files");
    const singleFile = formData.get("file");
    const files = [...fileEntries, ...(singleFile ? [singleFile] : [])].filter(
      (item): item is File => item instanceof File,
    );

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Enforce upload count limit
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_UPLOAD} files per upload` },
        { status: 400 },
      );
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          error: `Total upload size exceeds ${Math.floor(MAX_TOTAL_UPLOAD_SIZE / (1024 * 1024))}MB limit`,
        },
        { status: 400 },
      );
    }

    // Pre-validate all files first to avoid partial writes when one file fails.
    const preparedFiles: Array<{
      file: File;
      arrayBuffer: ArrayBuffer;
    }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 5MB limit" },
          { status: 400 },
        );
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      if (!validateFileMagicBytes(arrayBuffer, file.type)) {
        return NextResponse.json(
          { error: `File content does not match declared type: ${file.name}` },
          { status: 400 },
        );
      }

      preparedFiles.push({ file, arrayBuffer });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const results = [] as Array<{
      url: string;
      name: string;
      size: number;
      type: string;
    }>;

    for (const prepared of preparedFiles) {
      const extension = path.extname(prepared.file.name);
      const safeName = sanitizeFileName(
        path.basename(prepared.file.name, extension),
      );
      const fileName = `${safeName}-${randomUUID()}${extension}`;
      const buffer = Buffer.from(prepared.arrayBuffer);
      await writeFile(path.join(uploadDir, fileName), buffer);

      results.push({
        url: `/uploads/${fileName}`,
        name: prepared.file.name,
        size: prepared.file.size,
        type: prepared.file.type,
      });
    }

    return NextResponse.json({ data: results }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
