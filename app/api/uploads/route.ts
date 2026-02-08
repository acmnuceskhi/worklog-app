import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const results = [] as Array<{
      url: string;
      name: string;
      size: number;
      type: string;
    }>;

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

      const extension = path.extname(file.name);
      const safeName = sanitizeFileName(path.basename(file.name, extension));
      const fileName = `${safeName}-${randomUUID()}${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);

      results.push({
        url: `/uploads/${fileName}`,
        name: file.name,
        size: file.size,
        type: file.type,
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
