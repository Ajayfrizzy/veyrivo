import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { ApiError } from "../http/errors";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_PROOF_BYTES = 100 * 1024 * 1024;
export const MAX_PROOF_FILES = 10;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"]);
const root = process.env.PRIVATE_UPLOAD_DIR
  ? resolve(process.env.PRIVATE_UPLOAD_DIR)
  : resolve(/* turbopackIgnore: true */ process.cwd(), "../../.data/uploads");

export async function storePrivateFile(file: File) {
  if (!allowedTypes.has(file.type)) throw new ApiError(415, "FILE_TYPE_UNSUPPORTED", "Only JPEG, PNG, WebP, PDF, and text files are allowed.");
  if (file.size < 1 || file.size > MAX_FILE_BYTES) throw new ApiError(413, "FILE_SIZE_INVALID", "A proof file must be between 1 byte and 25 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extname(file.name).toLowerCase().slice(0, 10)}`;
  const target = join(root, storageKey);
  if (!target.startsWith(`${root}/`)) throw new ApiError(400, "FILE_NAME_INVALID", "The file name is invalid.");
  await mkdir(join(root, storageKey.split("/")[0]), { recursive: true });
  await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
  return { storageKey, sha256: createHash("sha256").update(bytes).digest("hex"), sizeBytes: bytes.length };
}

export async function readPrivateFile(storageKey: string) {
  const target = join(root, storageKey);
  if (!target.startsWith(`${root}/`)) throw new ApiError(400, "FILE_KEY_INVALID", "The file key is invalid.");
  return readFile(target);
}
