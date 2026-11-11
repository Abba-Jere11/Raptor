import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import sharp from "sharp";
import { IMAGE_READ_ERROR } from "@/lib/media/files";
import { verifyMuxSignature } from "@/lib/media/mux-signature";
import { renderStill } from "@/lib/media/render";

describe("image renditions", () => {
  it("makes a gallery and a thumb from a real image", async () => {
    const png = await sharp({ create: { width: 20, height: 10, channels: 3, background: "#245" } }).png().toBuffer();
    const rendered = await renderStill(png);
    expect(rendered.width).toBe(20);
    expect(rendered.height).toBe(10);
    expect(rendered.gallery.length).toBeGreaterThan(10);
    expect(rendered.thumb.length).toBeGreaterThan(10);
    const gallery = await sharp(rendered.gallery).metadata();
    expect(gallery.format).toBe("webp");
    expect(gallery.width).toBe(20);
  });

  it("rejects a file that is not an image", async () => {
    await expect(renderStill(Buffer.from("this is not a jpeg"))).rejects.toThrow(IMAGE_READ_ERROR);
  });
});

describe("Mux webhook signature", () => {
  it("accepts a current signature and rejects a bad or stale one", () => {
    const secret = "test-secret";
    const body = JSON.stringify({ type: "video.asset.ready" });
    const now = 1_700_000_000_000;
    const t = String(Math.floor(now / 1000));
    const sig = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
    expect(verifyMuxSignature(body, `t=${t},v1=${sig}`, secret, now)).toBe(true);
    expect(verifyMuxSignature(body, `t=${t},v1=${"ab".repeat(32)}`, secret, now)).toBe(false);
    expect(verifyMuxSignature(body, `t=${Number(t) - 600},v1=${sig}`, secret, now)).toBe(false);
    expect(verifyMuxSignature(body, "", secret, now)).toBe(false);
  });
});
