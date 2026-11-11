import sharp from "sharp";
import { IMAGE_READ_ERROR } from "./files";

/** Gallery and thumb WebP renditions. Originals stay in private storage. */
export async function renderStill(buffer: Buffer): Promise<{ gallery: Buffer; thumb: Buffer; width: number; height: number }> {
  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(buffer, { failOn: "error" }).rotate().metadata();
    if (!meta.width || !meta.height) throw new Error(IMAGE_READ_ERROR);
    width = meta.width;
    height = meta.height;
    const gallery = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const thumb = await sharp(buffer).rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    return { gallery, thumb, width, height };
  } catch (err) {
    if (err instanceof Error && err.message === IMAGE_READ_ERROR) throw err;
    throw new Error(IMAGE_READ_ERROR);
  }
}
